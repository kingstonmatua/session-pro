import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRecurringPaymentLink } from '@/lib/email';

export const runtime = 'nodejs';

const FREQUENCY_DAYS: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 28 };

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 50 * 60 * 60 * 1000).toISOString();

  // Find active recurring bookings whose next session is within 50h and link hasn't been sent yet
  const { data: recurrings } = await admin
    .from('recurring_bookings')
    .select('id, pro_id, client_name, client_email, service_id, frequency, next_starts_at, next_ends_at')
    .eq('status', 'active')
    .lte('next_starts_at', windowEnd)
    .is('last_link_sent_at', null);

  if (!recurrings || recurrings.length === 0) {
    return NextResponse.json({ sent: 0, at: now.toISOString() });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  let sent = 0;

  for (const recurring of recurrings) {
    try {
      const [{ data: pro }, { data: service }] = await Promise.all([
        admin.from('pros').select('full_name, timezone, slug, stripe_connect_account_id').eq('id', recurring.pro_id).single(),
        admin.from('services').select('name, price_cents, currency').eq('id', recurring.service_id).single(),
      ]);

      if (!pro || !service) continue;

      // Conflict check
      const [{ count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
        admin.from('bookings').select('id', { count: 'exact', head: true })
          .eq('pro_id', recurring.pro_id)
          .in('status', ['pending_payment', 'confirmed'])
          .lt('starts_at', recurring.next_ends_at)
          .gt('ends_at', recurring.next_starts_at),
        admin.from('booking_holds').select('id', { count: 'exact', head: true })
          .eq('pro_id', recurring.pro_id)
          .eq('status', 'active')
          .gt('expires_at', now.toISOString())
          .lt('starts_at', recurring.next_ends_at)
          .gt('ends_at', recurring.next_starts_at),
      ]);

      if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0) {
        console.warn(`[cron/recurring] conflict for recurring ${recurring.id}, skipping`);
        continue;
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
      const { data: hold } = await admin.from('booking_holds').insert({
        pro_id: recurring.pro_id,
        service_id: recurring.service_id,
        starts_at: recurring.next_starts_at,
        ends_at: recurring.next_ends_at,
        expires_at: expiresAt,
        client_email: recurring.client_email,
      }).select('id').single();

      if (!hold) continue;

      let connectAccountId: string | null = null;
      if (pro.stripe_connect_account_id) {
        try {
          const account = await stripe.accounts.retrieve(pro.stripe_connect_account_id as string);
          if (account.charges_enabled) connectAccountId = pro.stripe_connect_account_id as string;
        } catch { /* proceed without Connect */ }
      }

      const platformFeeCents = Math.round(service.price_cents * 0.10);
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        customer_email: recurring.client_email,
        line_items: [{
          price_data: {
            currency: service.currency,
            product_data: { name: service.name, description: `with ${pro.full_name}` },
            unit_amount: service.price_cents,
          },
          quantity: 1,
        }],
        metadata: {
          holdId: hold.id,
          proId: recurring.pro_id,
          serviceId: recurring.service_id,
          proSlug: pro.slug,
          recurringBookingId: recurring.id,
        },
        success_url: `${appUrl}/booking/success?proSlug=${pro.slug}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/${pro.slug}`,
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      if (connectAccountId) {
        sessionParams.payment_intent_data = {
          application_fee_amount: platformFeeCents,
          transfer_data: { destination: connectAccountId },
        };
      }

      const checkoutSession = await stripe.checkout.sessions.create(sessionParams);
      await admin.from('booking_holds').update({ stripe_checkout_session_id: checkoutSession.id }).eq('id', hold.id);

      const paymentExpiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
      await sendRecurringPaymentLink({
        clientEmail: recurring.client_email,
        clientName: recurring.client_name,
        proName: pro.full_name,
        serviceName: service.name,
        startsAt: recurring.next_starts_at,
        timezone: pro.timezone,
        paymentUrl: checkoutSession.url!,
        paymentExpiresAt,
        recurringBookingId: recurring.id,
      });

      // Mark link sent — webhook will advance next_starts_at after payment
      await admin.from('recurring_bookings').update({ last_link_sent_at: now.toISOString() }).eq('id', recurring.id);
      sent++;
    } catch (err) {
      console.error(`[cron/recurring] error for ${recurring.id}:`, err instanceof Error ? err.message : err);
    }
  }

  // Also advance any recurring_bookings that are still active but have next_starts_at in the past
  // (i.e. client didn't pay — skip that occurrence and schedule the next)
  const { data: stale } = await admin
    .from('recurring_bookings')
    .select('id, frequency, next_starts_at, next_ends_at')
    .eq('status', 'active')
    .lt('next_starts_at', now.toISOString())
    .not('last_link_sent_at', 'is', null);

  for (const s of stale ?? []) {
    const freqMs = FREQUENCY_DAYS[s.frequency] * 24 * 60 * 60 * 1000;
    let nextStartMs = new Date(s.next_starts_at).getTime() + freqMs;
    let nextEndMs = new Date(s.next_ends_at).getTime() + freqMs;
    const minNext = now.getTime() + 24 * 60 * 60 * 1000;
    while (nextStartMs < minNext) { nextStartMs += freqMs; nextEndMs += freqMs; }
    await admin.from('recurring_bookings').update({
      next_starts_at: new Date(nextStartMs).toISOString(),
      next_ends_at: new Date(nextEndMs).toISOString(),
      last_link_sent_at: null,
    }).eq('id', s.id);
  }

  console.log(`[cron/recurring] sent ${sent} payment link(s), advanced ${(stale ?? []).length} stale recurring(s)`);
  return NextResponse.json({ sent, staleAdvanced: (stale ?? []).length, at: now.toISOString() });
}

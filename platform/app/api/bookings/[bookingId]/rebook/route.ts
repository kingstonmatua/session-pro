import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentLinkToClient } from '@/lib/email';
import { resolveConnectAccount } from '@/lib/clubBilling';

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone, slug, stripe_connect_account_id, club_id')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const { bookingId } = await params;
  const body = await req.json().catch(() => ({}));
  const { newStartsAt, newEndsAt } = body as { newStartsAt?: string; newEndsAt?: string };

  if (!newStartsAt || !newEndsAt) {
    return NextResponse.json({ error: 'newStartsAt and newEndsAt are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, clients(full_name, email), services(*)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const client = booking.clients as { full_name: string; email: string };
  const service = booking.services as {
    id: string; name: string; price_cents: number;
    duration_minutes: number; buffer_minutes: number; currency: string;
  };

  // Conflict check
  const [{ count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
    admin
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .in('status', ['pending_payment', 'confirmed'])
      .lt('starts_at', newEndsAt)
      .gt('ends_at', newStartsAt),
    admin
      .from('booking_holds')
      .select('id', { count: 'exact', head: true })
      .eq('pro_id', pro.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .lt('starts_at', newEndsAt)
      .gt('ends_at', newStartsAt),
  ]);

  if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0) {
    return NextResponse.json({ error: 'That time slot has a conflict.' }, { status: 409 });
  }

  // 24h booking hold
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  const { data: hold, error: holdError } = await admin
    .from('booking_holds')
    .insert({
      pro_id: pro.id,
      service_id: service.id,
      starts_at: newStartsAt,
      ends_at: newEndsAt,
      expires_at: expiresAt,
      client_email: client.email,
    })
    .select('id')
    .single();

  if (holdError || !hold) {
    return NextResponse.json({ error: 'Failed to reserve time slot' }, { status: 500 });
  }

  // Stripe Checkout Session
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  let club: { stripe_connect_account_id: string | null } | null = null;
  if (pro.club_id) {
    const { data: clubRow } = await admin.from('clubs').select('stripe_connect_account_id').eq('id', pro.club_id).single();
    club = clubRow;
  }
  const { connectAccountId, feePercent } = await resolveConnectAccount(stripe, pro, club);
  const platformFeeCents = Math.round(service.price_cents * feePercent);

  let session: Stripe.Checkout.Session;
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      customer_email: client.email,
      line_items: [{
        price_data: {
          currency: service.currency,
          product_data: { name: service.name, description: `with ${pro.full_name}` },
          unit_amount: service.price_cents,
        },
        quantity: 1,
      }],
      metadata: { holdId: hold.id, proId: pro.id, serviceId: service.id, proSlug: pro.slug },
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

    session = await stripe.checkout.sessions.create(sessionParams);
  } catch (err) {
    await admin.from('booking_holds').update({ status: 'released' }).eq('id', hold.id);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create payment session: ' + msg }, { status: 500 });
  }

  await admin.from('booking_holds').update({ stripe_checkout_session_id: session.id }).eq('id', hold.id);

  const paymentExpiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();

  await sendPaymentLinkToClient({
    clientEmail: client.email,
    clientName: client.full_name,
    proName: pro.full_name,
    serviceName: service.name,
    requestedStartsAt: newStartsAt,
    timezone: pro.timezone,
    location: null,
    paymentUrl: session.url!,
    paymentExpiresAt,
  });

  return NextResponse.json({ ok: true });
}

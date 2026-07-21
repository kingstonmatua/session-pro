import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { sendNoShowNotification, sendNextSessionLink } from '@/lib/email';

type Params = { params: Promise<{ bookingId: string }> };
type NoShowAction = 'none' | 'refund' | 'credit';

export async function POST(req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, slug, full_name, timezone')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { bookingId } = await params;
  const body = await req.json().catch(() => ({}));

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, clients(full_name, email), services(name, no_show_policy), payments(stripe_payment_intent_id)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .eq('status', 'confirmed')
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const service = booking.services as { name: string; no_show_policy: 'forfeit' | 'credit' } | null;
  const defaultAction: NoShowAction = service?.no_show_policy === 'credit' ? 'credit' : 'none';
  const action: NoShowAction = (['none', 'refund', 'credit'] as const).includes(body.action) ? body.action : defaultAction;

  let refunded = false;
  let creditIssued = false;

  if (action === 'refund') {
    const paymentIntentId = booking.payments?.[0]?.stripe_payment_intent_id ?? null;
    if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.refunds.create({ payment_intent: paymentIntentId });
        await admin
          .from('payments')
          .update({ status: 'refunded', refunded_at: new Date().toISOString(), refunded_amount_cents: booking.price_cents })
          .eq('stripe_payment_intent_id', paymentIntentId);
        refunded = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[no-show] refund failed:', msg);
        return NextResponse.json({ error: 'Refund failed: ' + msg }, { status: 500 });
      }
    }
  }

  const clientEmail = booking.clients?.email;
  const clientName = booking.clients?.full_name ?? 'there';
  const serviceName = service?.name ?? 'session';

  if (action === 'credit') {
    const { data: enrollment, error: enrollError } = await admin
      .from('package_enrollments')
      .insert({
        pro_id: pro.id,
        client_id: booking.client_id,
        service_id: booking.service_id,
        sessions_total: 1,
        sessions_used: 0,
        status: 'active',
      })
      .select('id')
      .single();

    if (enrollError) {
      console.error('[no-show] credit issuance failed:', enrollError.message);
    } else if (enrollment && clientEmail) {
      creditIssued = true;
      await sendNextSessionLink({
        clientEmail,
        clientName,
        proName: pro.full_name,
        proSlug: pro.slug,
        serviceName,
        enrollmentId: enrollment.id,
        sessionNumber: 1,
        sessionsTotal: 1,
      });
    }
  }

  await admin
    .from('bookings')
    .update({ status: 'no_show' })
    .eq('id', bookingId);

  if (clientEmail) {
    await sendNoShowNotification({
      clientEmail,
      clientName,
      proName: pro.full_name,
      serviceName,
      startsAt: booking.starts_at,
      timezone: pro.timezone,
      refunded,
      creditIssued,
    });
  }

  return NextResponse.json({ ok: true });
}

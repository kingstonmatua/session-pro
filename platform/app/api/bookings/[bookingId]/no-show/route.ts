import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { sendNoShowNotification } from '@/lib/email';

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(req: Request, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone')
    .eq('user_id', user.id)
    .single();
  if (!pro) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { bookingId } = await params;
  const body = await req.json().catch(() => ({}));
  const issueRefund = body.refund === true;

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, clients(full_name, email), services(name), payments(stripe_payment_intent_id)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .eq('status', 'confirmed')
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  let refunded = false;

  if (issueRefund) {
    const paymentIntentId = booking.payments?.[0]?.stripe_payment_intent_id ?? null;
    if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.refunds.create({ payment_intent: paymentIntentId });
        await admin
          .from('payments')
          .update({ status: 'refunded', refunded_at: new Date().toISOString() })
          .eq('stripe_payment_intent_id', paymentIntentId);
        refunded = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[no-show] refund failed:', msg);
        return NextResponse.json({ error: 'Refund failed: ' + msg }, { status: 500 });
      }
    }
  }

  await admin
    .from('bookings')
    .update({ status: 'no_show' })
    .eq('id', bookingId);

  const clientEmail = booking.clients?.email;
  const clientName = booking.clients?.full_name ?? 'there';
  const serviceName = booking.services?.name ?? 'session';

  if (clientEmail) {
    await sendNoShowNotification({
      clientEmail,
      clientName,
      proName: pro.full_name,
      serviceName,
      startsAt: booking.starts_at,
      timezone: pro.timezone,
      refunded,
    });
  }

  return NextResponse.json({ ok: true });
}

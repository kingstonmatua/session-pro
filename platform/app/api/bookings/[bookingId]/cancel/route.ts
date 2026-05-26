import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { sendCancellationEmail } from '@/lib/email';

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(_req: Request, { params }: Params) {
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

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, clients(full_name, email), services(name), payments(stripe_payment_intent_id)')
    .eq('id', bookingId)
    .eq('pro_id', pro.id)
    .in('status', ['confirmed', 'pending_payment'])
    .single();

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  // Issue Stripe refund if a payment intent exists
  const paymentIntentId = booking.payments?.[0]?.stripe_payment_intent_id ?? null;
  if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      await stripe.refunds.create({ payment_intent: paymentIntentId });
      await admin
        .from('payments')
        .update({ status: 'refunded', refunded_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', paymentIntentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[cancel] refund failed:', msg);
      return NextResponse.json({ error: 'Refund failed: ' + msg }, { status: 500 });
    }
  }

  // Mark booking cancelled
  await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  // Email the client
  const clientEmail = booking.clients?.email;
  const clientName = booking.clients?.full_name ?? 'there';
  const serviceName = booking.services?.name ?? 'session';

  if (clientEmail) {
    await sendCancellationEmail({
      clientEmail,
      clientName,
      proName: pro.full_name,
      serviceName,
      startsAt: booking.starts_at,
      timezone: pro.timezone,
    });
  }

  return NextResponse.json({ ok: true });
}

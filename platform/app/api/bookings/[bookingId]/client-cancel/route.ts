import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { sendCancellationEmail } from '@/lib/email';

type Params = { params: Promise<{ bookingId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { bookingId } = await params;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, pros(full_name, timezone, club_or_business), clients(full_name, email), services(name, cancellation_window_hours, cancellation_refund_tiers), payments(stripe_payment_intent_id)')
    .eq('id', bookingId)
    .in('status', ['confirmed', 'pending_payment'])
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found or already cancelled' }, { status: 404 });
  }

  const pro = booking.pros as { full_name: string; timezone: string; club_or_business: string | null };
  const client = booking.clients as { full_name: string; email: string };
  const service = booking.services as {
    name: string;
    cancellation_window_hours: number;
    cancellation_refund_tiers: { hours_before: number; refund_percent: number }[];
  };

  // Enforce the service's cancellation window
  const hoursUntilSession = (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilSession < service.cancellation_window_hours) {
    return NextResponse.json(
      { error: `Cancellations must be made at least ${service.cancellation_window_hours} hours before the session.` },
      { status: 409 }
    );
  }

  // Apply the highest tier threshold met by the notice given
  const tiers = [...(service.cancellation_refund_tiers ?? [{ hours_before: 0, refund_percent: 100 }])]
    .sort((a, b) => b.hours_before - a.hours_before);
  const tier = tiers.find(t => hoursUntilSession >= t.hours_before) ?? tiers[tiers.length - 1];
  const refundPercent = tier?.refund_percent ?? 100;
  const refundAmountCents = Math.round(booking.price_cents * refundPercent / 100);

  // Issue Stripe refund if a payment intent exists and the tier grants one
  const paymentIntentId = (booking.payments as { stripe_payment_intent_id: string | null }[] | null)?.[0]?.stripe_payment_intent_id ?? null;
  if (paymentIntentId && process.env.STRIPE_SECRET_KEY && refundAmountCents > 0) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const isFullRefund = refundAmountCents >= booking.price_cents;
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(isFullRefund ? {} : { amount: refundAmountCents }),
      });
      await admin
        .from('payments')
        .update({
          status: isFullRefund ? 'refunded' : 'partially_refunded',
          refunded_at: new Date().toISOString(),
          refunded_amount_cents: refundAmountCents,
        })
        .eq('stripe_payment_intent_id', paymentIntentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[client-cancel] refund failed:', msg);
      return NextResponse.json({ error: 'Refund failed: ' + msg }, { status: 500 });
    }
  }

  await admin.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);

  await sendCancellationEmail({
    clientEmail: client.email,
    clientName: client.full_name,
    proName: pro.full_name,
    serviceName: service.name,
    startsAt: booking.starts_at,
    timezone: pro.timezone,
    refundPercent,
    refundAmountCents,
  });

  return NextResponse.json({ ok: true });
}

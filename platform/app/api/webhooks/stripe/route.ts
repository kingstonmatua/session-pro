import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendClientConfirmation, sendProNotification, sendReviewRequest, sendReminderEmail } from '@/lib/email';
import { resolveConnectAccount } from '@/lib/clubBilling';


export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const { holdId, proId, serviceId, requestId, groupSlotId, recurringBookingId } = (session.metadata ?? {}) as {
    holdId?: string;
    proId?: string;
    serviceId?: string;
    requestId?: string;
    groupSlotId?: string;
    recurringBookingId?: string;
  };

  if (!holdId || !proId || !serviceId) {
    // Payment Link purchase — no booking record created, Stripe handles the receipt
    console.log('[webhook] payment link purchase completed:', session.id, session.customer_details?.email);
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  try {
  const [{ data: hold }, { data: service }, { data: pro }] = await Promise.all([
    supabase.from('booking_holds').select('*').eq('id', holdId).single(),
    supabase.from('services').select('name, price_cents, currency, duration_minutes, kind, session_count').eq('id', serviceId).single(),
    supabase.from('pros').select('full_name, timezone, club_or_business, user_id, club_id, stripe_connect_account_id').eq('id', proId).single(),
  ]);

  if (!hold || hold.status !== 'active') {
    return NextResponse.json({ received: true });
  }
  if (!service || !pro) {
    return NextResponse.json({ error: 'Service or pro not found' }, { status: 404 });
  }

  const customerEmail = session.customer_details?.email ?? '';
  const customerName = session.customer_details?.name ?? 'Guest';

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle();

  let clientId: string;
  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({ full_name: customerName, email: customerEmail })
      .select('id')
      .single();
    if (clientError || !newClient) {
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
    clientId = newClient.id;
  }

  const priceCents = service.price_cents;
  let club: { stripe_connect_account_id: string | null } | null = null;
  if (pro.club_id) {
    const { data: clubRow } = await supabase.from('clubs').select('stripe_connect_account_id').eq('id', pro.club_id).single();
    club = clubRow;
  }
  const { feePercent } = await resolveConnectAccount(stripe, pro, club);
  const platformFeeCents = Math.round(priceCents * feePercent);
  const proPayoutCents = priceCents - platformFeeCents;

  // For package purchases, create an enrollment before the booking
  let enrollmentId: string | null = null;
  if (service.kind === 'package') {
    const { data: enrollment } = await supabase
      .from('package_enrollments')
      .insert({
        pro_id: proId,
        client_id: clientId,
        service_id: serviceId,
        sessions_total: service.session_count,
        sessions_used: 1,
        status: 'active',
      })
      .select('id')
      .single();
    enrollmentId = enrollment?.id ?? null;
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      pro_id: proId,
      client_id: clientId,
      service_id: serviceId,
      hold_id: holdId,
      enrollment_id: enrollmentId,
      group_slot_id: groupSlotId ?? null,
      starts_at: hold.starts_at,
      ends_at: hold.ends_at,
      status: 'confirmed',
      payment_status: 'paid',
      price_cents: priceCents,
      platform_fee_cents: platformFeeCents,
      pro_payout_cents: proPayoutCents,
      currency: service.currency,
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    // 23505 = unique constraint: booking already exists for this slot (duplicate webhook delivery)
    if (bookingError?.code === '23505') {
      return NextResponse.json({ received: true });
    }
    console.error('[webhook] booking insert failed:', bookingError);
    return NextResponse.json({ error: 'Failed to create booking', detail: bookingError?.message }, { status: 500 });
  }

  // Finalize payment record and hold in parallel with email sends
  let proEmail: string | undefined;
  if (pro.user_id) {
    const { data: { user: proUser } } = await supabase.auth.admin.getUserById(pro.user_id);
    proEmail = proUser?.email;
  }

  const paymentInsert = supabase.from('payments').insert({
    booking_id: booking.id,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amount_cents: priceCents,
    platform_fee_cents: platformFeeCents,
    currency: service.currency,
    status: 'paid',
    paid_at: new Date().toISOString(),
  }).select('id').single();

  await Promise.all([
    paymentInsert.then(async ({ data: payment }) => {
      if (enrollmentId && payment?.id) {
        await supabase.from('package_enrollments').update({ payment_id: payment.id }).eq('id', enrollmentId);
      }
      if (requestId) {
        await supabase.from('booking_requests').update({ status: 'paid' }).eq('id', requestId);
      }
      if (recurringBookingId) {
        const { data: rb } = await supabase
          .from('recurring_bookings')
          .select('frequency, next_starts_at, next_ends_at')
          .eq('id', recurringBookingId)
          .single();
        if (rb) {
          const freqDays: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 28 };
          const freqMs = (freqDays[rb.frequency] ?? 7) * 24 * 60 * 60 * 1000;
          await supabase.from('recurring_bookings').update({
            next_starts_at: new Date(new Date(rb.next_starts_at).getTime() + freqMs).toISOString(),
            next_ends_at: new Date(new Date(rb.next_ends_at).getTime() + freqMs).toISOString(),
            last_link_sent_at: null,
          }).eq('id', recurringBookingId);
        }
      }
    }),
    supabase.from('booking_holds').update({ status: 'converted' }).eq('id', holdId),
    sendClientConfirmation({
      clientEmail: customerEmail,
      clientName: customerName,
      proName: pro.full_name,
      serviceName: service.name,
      startsAt: hold.starts_at,
      timezone: pro.timezone,
      location: pro.club_or_business,
      priceCents,
      sessionContext: service.kind === 'package' ? `Session 1 of ${service.session_count}` : undefined,
      bookingId: booking.id,
    }),
    proEmail ? sendProNotification({
      proEmail,
      proName: pro.full_name,
      clientName: customerName,
      clientEmail: customerEmail,
      serviceName: service.name,
      startsAt: hold.starts_at,
      timezone: pro.timezone,
      payoutCents: proPayoutCents,
    }) : Promise.resolve(),
    // Schedule reminder 24h before session (only if session is >25h away)
    customerEmail && new Date(hold.starts_at).getTime() - Date.now() > 25 * 60 * 60 * 1000
      ? sendReminderEmail({
          clientEmail: customerEmail,
          clientName: customerName,
          proName: pro.full_name,
          serviceName: service.name,
          startsAt: hold.starts_at,
          timezone: pro.timezone,
          location: pro.club_or_business,
          scheduledAt: new Date(new Date(hold.starts_at).getTime() - 24 * 60 * 60 * 1000).toISOString(),
        })
      : Promise.resolve(),
    // Schedule review request 24h after the session ends
    customerEmail ? sendReviewRequest({
      clientEmail: customerEmail,
      clientName: customerName,
      proName: pro.full_name,
      serviceName: service.name,
      bookingId: booking.id,
      scheduledAt: new Date(new Date(hold.ends_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }) : Promise.resolve(),
  ]);

  return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[webhook] unhandled error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

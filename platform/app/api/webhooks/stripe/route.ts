import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendClientConfirmation, sendProNotification } from '@/lib/email';

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
  const { holdId, proId, serviceId } = (session.metadata ?? {}) as {
    holdId?: string;
    proId?: string;
    serviceId?: string;
  };

  if (!holdId || !proId || !serviceId) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
  const [{ data: hold }, { data: service }, { data: pro }] = await Promise.all([
    supabase.from('booking_holds').select('*').eq('id', holdId).single(),
    supabase.from('services').select('name, price_cents, currency, duration_minutes').eq('id', serviceId).single(),
    supabase.from('pros').select('full_name, timezone, club_or_business, user_id').eq('id', proId).single(),
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
  const platformFeeCents = Math.round(priceCents * 0.10);
  const proPayoutCents = priceCents - platformFeeCents;

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      pro_id: proId,
      client_id: clientId,
      service_id: serviceId,
      hold_id: holdId,
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

  await Promise.all([
    supabase.from('payments').insert({
      booking_id: booking.id,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      amount_cents: priceCents,
      platform_fee_cents: platformFeeCents,
      currency: service.currency,
      status: 'paid',
      paid_at: new Date().toISOString(),
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
  ]);

  return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[webhook] unhandled error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

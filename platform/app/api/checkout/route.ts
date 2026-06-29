import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getIP } from '@/lib/rateLimit';

function parseSlotToISO(dateStr: string, timeSlot: string, timezone: string): string {
  const [time, ampm] = timeSlot.split(' ');
  const [h, m] = time.split(':').map(Number);
  let hour = h;
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;

  // Build an approximate UTC date treating the local time as UTC
  const approxUTC = new Date(Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    hour, m, 0,
  ));

  // Find what this UTC moment looks like in the pro's timezone
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(approxUTC);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value);
  const tzHour = get('hour') % 24;
  const localAsUTC = Date.UTC(get('year'), get('month') - 1, get('day'), tzHour, get('minute'), get('second'));

  // The TZ offset (in ms) is the difference between approxUTC and localAsUTC
  const offsetMs = approxUTC.getTime() - localAsUTC;

  // Apply that offset to produce the true UTC equivalent of the target local time
  const targetUTC = new Date(Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    hour, m, 0,
  ).valueOf() + offsetMs);

  return targetUTC.toISOString();
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIP(req), 5, 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { proId, serviceId, date, timeSlot, groupSlotId } = body as {
    proId?: string;
    serviceId?: string;
    date?: string;
    timeSlot?: string;
    groupSlotId?: string;
  };

  if (!proId || !serviceId || !date || !timeSlot) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Payment processing is not configured' }, { status: 503 });
  }

  const supabase = createAdminClient();

  const [{ data: pro, error: proError }, { data: service, error: serviceError }] = await Promise.all([
    supabase.from('pros').select('id, full_name, timezone, slug, status, stripe_connect_account_id').eq('id', proId).single(),
    supabase.from('services').select('*').eq('id', serviceId).eq('is_active', true).single(),
  ]);

  if (proError || !pro || pro.status !== 'active') {
    return NextResponse.json({ error: 'Pro not found' }, { status: 404 });
  }
  if (serviceError || !service || service.pro_id !== proId) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const startsAt = parseSlotToISO(date, timeSlot, pro.timezone);
  const endsAt = new Date(
    new Date(startsAt).getTime() + (service.duration_minutes + service.buffer_minutes) * 60_000,
  ).toISOString();

  if (groupSlotId) {
    // Group booking: check capacity against existing bookings + active holds for this slot
    const { data: groupSlot } = await supabase
      .from('group_slots')
      .select('id, capacity, starts_at, service_id')
      .eq('id', groupSlotId)
      .eq('pro_id', proId)
      .single();

    if (!groupSlot) {
      return NextResponse.json({ error: 'Group slot not found.' }, { status: 404 });
    }

    const [{ count: groupBookings }, { count: activeHolds }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('group_slot_id', groupSlotId)
        .in('status', ['pending_payment', 'confirmed']),
      supabase
        .from('booking_holds')
        .select('id', { count: 'exact', head: true })
        .eq('pro_id', proId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .eq('starts_at', groupSlot.starts_at),
    ]);

    if ((groupBookings ?? 0) + (activeHolds ?? 0) >= groupSlot.capacity) {
      return NextResponse.json({ error: 'This group session is full.' }, { status: 409 });
    }
  } else {
    // Individual booking: reject if slot overlaps a group slot or any existing booking/hold
    const [{ count: groupSlotConflict }, { count: bookingConflicts }, { count: holdConflicts }] = await Promise.all([
      supabase
        .from('group_slots')
        .select('id', { count: 'exact', head: true })
        .eq('pro_id', proId)
        .eq('starts_at', startsAt),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('pro_id', proId)
        .in('status', ['pending_payment', 'confirmed'])
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt),
      supabase
        .from('booking_holds')
        .select('id', { count: 'exact', head: true })
        .eq('pro_id', proId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .lt('starts_at', endsAt)
        .gt('ends_at', startsAt),
    ]);

    if ((groupSlotConflict ?? 0) > 0) {
      return NextResponse.json({ error: 'This slot is reserved for a group session.' }, { status: 409 });
    }
    if ((bookingConflicts ?? 0) > 0 || (holdConflicts ?? 0) > 0) {
      return NextResponse.json({ error: 'This time slot is no longer available.' }, { status: 409 });
    }
  }

  // Create 15-minute booking hold
  const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
  const { data: hold, error: holdError } = await supabase
    .from('booking_holds')
    .insert({ pro_id: proId, service_id: serviceId, starts_at: startsAt, ends_at: endsAt, expires_at: expiresAt })
    .select('id')
    .single();

  if (holdError || !hold) {
    return NextResponse.json({ error: 'Failed to reserve time slot. Please try again.' }, { status: 500 });
  }

  // Create Stripe Checkout Session
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const host = req.headers.get('host') ?? 'localhost:3000';
  const rawOrigin = req.headers.get('origin');
  const origin = rawOrigin ?? (host.includes('localhost') || host.includes('127.0.0.1')
    ? `http://${host}`
    : `https://${host}`);

  // Check if pro has a fully enabled Stripe Connect account
  let connectAccountId: string | null = null;
  if (pro.stripe_connect_account_id) {
    try {
      const account = await stripe.accounts.retrieve(pro.stripe_connect_account_id as string);
      if (account.charges_enabled) connectAccountId = pro.stripe_connect_account_id as string;
    } catch {
      // proceed without Connect
    }
  }

  const platformFeeCents = Math.round(service.price_cents * 0.10);

  let session: Stripe.Checkout.Session;
  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: service.currency,
          product_data: {
            name: service.name,
            description: `with ${pro.full_name} · ${timeSlot} on ${date}`,
          },
          unit_amount: service.price_cents,
        },
        quantity: 1,
      }],
      metadata: { holdId: hold.id, proId, serviceId, proSlug: pro.slug, ...(groupSlotId ? { groupSlotId } : {}) },
      success_url: `${origin}/booking/success?proSlug=${pro.slug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${pro.slug}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    };

    if (connectAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: connectAccountId },
      };
    }

    session = await stripe.checkout.sessions.create(sessionParams);
  } catch {
    // Release the hold if Stripe session creation fails
    await supabase.from('booking_holds').update({ status: 'released' }).eq('id', hold.id);
    return NextResponse.json({ error: 'Failed to create payment session. Please try again.' }, { status: 500 });
  }

  await supabase
    .from('booking_holds')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', hold.id);

  return NextResponse.json({ url: session.url });
}

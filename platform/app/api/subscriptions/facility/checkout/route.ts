import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const { interval } = await req.json().catch(() => ({})) as { interval?: string };
  if (interval !== 'month' && interval !== 'year') {
    return NextResponse.json({ error: 'interval must be month or year' }, { status: 400 });
  }

  const priceId = interval === 'month'
    ? process.env.STRIPE_FACILITY_MONTHLY_PRICE_ID
    : process.env.STRIPE_FACILITY_ANNUAL_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: 'Subscription price not configured' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: club } = await admin
    .from('clubs')
    .select('id, name, stripe_customer_id, subscription_status')
    .eq('user_id', user.id)
    .single();

  if (!club) return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  if (club.subscription_status === 'active') {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
  }

  // Seat count = current active roster
  const { count: seatCount } = await admin
    .from('pros')
    .select('id', { count: 'exact', head: true })
    .eq('club_id', club.id)
    .eq('status', 'active');

  const seats = Math.max(seatCount ?? 1, 1);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  let customerId = club.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: club.name,
      email: user.email,
      metadata: { clubId: club.id },
    });
    customerId = customer.id;
    await admin.from('clubs').update({ stripe_customer_id: customerId }).eq('id', club.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: seats }],
    metadata: { entity: 'club', entityId: club.id },
    subscription_data: { metadata: { clubId: club.id } },
    success_url: `${appUrl}/club-dashboard?subscription=success`,
    cancel_url: `${appUrl}/club-dashboard`,
  });

  return NextResponse.json({ url: session.url, seats });
}

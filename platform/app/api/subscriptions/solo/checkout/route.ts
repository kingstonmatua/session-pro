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
    ? process.env.STRIPE_SOLO_MONTHLY_PRICE_ID
    : process.env.STRIPE_SOLO_ANNUAL_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: 'Subscription price not configured' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: pro } = await admin
    .from('pros')
    .select('id, full_name, stripe_customer_id, billing_model')
    .eq('user_id', user.id)
    .single();

  if (!pro) return NextResponse.json({ error: 'Pro not found' }, { status: 404 });
  if (pro.billing_model !== 'take_rate') {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  // Reuse existing Stripe customer or create one
  let customerId = pro.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: pro.full_name,
      email: user.email,
      metadata: { proId: pro.id },
    });
    customerId = customer.id;
    await admin.from('pros').update({ stripe_customer_id: customerId }).eq('id', pro.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { entity: 'pro', entityId: pro.id },
    success_url: `${appUrl}/dashboard?subscription=success`,
    cancel_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}

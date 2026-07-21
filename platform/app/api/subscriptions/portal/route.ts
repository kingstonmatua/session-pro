import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(_req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';

  // Check pro first, then club
  const { data: pro } = await admin
    .from('pros')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: club } = pro?.stripe_customer_id
    ? { data: null }
    : await admin.from('clubs').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();

  const customerId = pro?.stripe_customer_id ?? club?.stripe_customer_id ?? null;
  const returnUrl = pro ? `${appUrl}/dashboard` : `${appUrl}/club-dashboard`;

  if (!customerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}

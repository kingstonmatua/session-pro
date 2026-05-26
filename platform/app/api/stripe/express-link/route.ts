import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: pro } = await supabase
    .from('pros')
    .select('stripe_connect_account_id')
    .eq('user_id', user.id)
    .single();

  if (!pro?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe account connected' }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const loginLink = await stripe.accounts.createLoginLink(pro.stripe_connect_account_id);

  return NextResponse.redirect(loginLink.url);
}

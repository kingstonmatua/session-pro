import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: pro } = await supabase
    .from('pros')
    .select('id, stripe_connect_account_id')
    .eq('user_id', user.id)
    .single();

  if (!pro) {
    return NextResponse.json({ error: 'Pro not found' }, { status: 404 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const admin = createAdminClient();

  let accountId = pro.stripe_connect_account_id as string | null;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express' });
      accountId = account.id;
      await admin
        .from('pros')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', pro.id);
    }

    const host = req.headers.get('host') ?? 'localhost:3000';
    const rawOrigin = req.headers.get('origin');
    const origin = rawOrigin ?? (host.includes('localhost') || host.includes('127.0.0.1')
      ? `http://${host}`
      : `https://${host}`);

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/connect/refresh`,
      return_url: `${origin}/dashboard/connect/return`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    console.error('[connect/onboard]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

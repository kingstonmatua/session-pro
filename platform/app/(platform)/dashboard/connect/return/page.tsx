import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export default async function ConnectReturnPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('id, stripe_connect_account_id')
    .eq('user_id', user.id)
    .single();

  if (!pro?.stripe_connect_account_id || !process.env.STRIPE_SECRET_KEY) {
    redirect('/dashboard');
  }

  let chargesEnabled = false;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const account = await stripe.accounts.retrieve(pro.stripe_connect_account_id as string);
    chargesEnabled = account.charges_enabled;
  } catch {
    redirect('/dashboard');
  }

  if (chargesEnabled) {
    // Mark pro status active if they were in draft
    const admin = createAdminClient();
    await admin
      .from('pros')
      .update({ status: 'active' })
      .eq('id', pro.id)
      .eq('status', 'draft');
  }

  redirect(`/dashboard?connect=${chargesEnabled ? 'success' : 'pending'}`);
}

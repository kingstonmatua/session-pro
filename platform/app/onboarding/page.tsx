import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingForm from './OnboardingForm';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (pro) redirect('/dashboard');

  return <OnboardingForm />;
}

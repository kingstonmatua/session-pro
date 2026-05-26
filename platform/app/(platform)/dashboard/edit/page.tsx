import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EditProfileForm } from './EditProfileForm';

export default async function EditProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!pro) redirect('/onboarding');

  const [{ data: availability }, { data: services }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('*')
      .eq('pro_id', pro.id)
      .eq('is_active', true)
      .order('day'),
    supabase
      .from('services')
      .select('*')
      .eq('pro_id', pro.id)
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">
        <EditProfileForm
          pro={pro}
          availability={availability ?? []}
          services={services ?? []}
        />
      </div>
    </div>
  );
}

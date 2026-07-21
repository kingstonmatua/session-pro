import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ClubEditForm } from './ClubEditForm';

export default async function ClubEditPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: club } = await supabase.from('clubs').select('*').eq('user_id', user.id).single();
  if (!club) redirect('/dashboard');

  return (
    <div className="admin-inner">
      <h1 className="admin-page-title">Branding</h1>
      <ClubEditForm club={club} />
    </div>
  );
}

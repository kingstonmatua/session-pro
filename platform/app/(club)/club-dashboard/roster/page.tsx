import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RosterManager } from './RosterManager';

export default async function ClubRosterPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: club } = await supabase.from('clubs').select('id').eq('user_id', user.id).single();
  if (!club) redirect('/dashboard');

  const { data: roster } = await supabase
    .from('pros')
    .select('id, full_name, slug, discipline, status')
    .eq('club_id', club.id)
    .order('full_name', { ascending: true });

  return (
    <div className="admin-inner">
      <h1 className="admin-page-title">Roster</h1>
      <RosterManager pros={roster ?? []} />
    </div>
  );
}

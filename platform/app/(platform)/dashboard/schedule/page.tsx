import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ScheduleClient } from './ScheduleClient';

export default async function SchedulePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('id, timezone')
    .eq('user_id', user.id)
    .single();
  if (!pro) redirect('/onboarding');

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString();

  const [{ data: rules }, { data: exceptions }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('*')
      .eq('pro_id', pro.id)
      .eq('is_active', true),
    supabase
      .from('availability_exceptions')
      .select('*')
      .eq('pro_id', pro.id)
      .gte('starts_at', from)
      .lte('starts_at', to)
      .order('starts_at'),
  ]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Link href="/dashboard" className="button" style={{ padding: '0 12px', minHeight: 36, fontSize: 14 }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Schedule</h1>
        </div>

        <ScheduleClient
          proId={pro.id}
          timezone={pro.timezone ?? 'America/New_York'}
          initialRules={rules ?? []}
          initialExceptions={exceptions ?? []}
        />
      </div>
    </div>
  );
}

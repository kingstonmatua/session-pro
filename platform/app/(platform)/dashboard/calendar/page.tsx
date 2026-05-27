import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ProCalendar } from './ProCalendar';

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone')
    .eq('user_id', user.id)
    .single();
  if (!pro) redirect('/onboarding');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();

  const [
    { data: bookings },
    { data: requests },
    { data: blockedTimes },
    { data: availability },
    { data: services },
  ] = await Promise.all([
    admin
      .from('bookings')
      .select('id, starts_at, ends_at, status, clients(full_name, email), services(name)')
      .eq('pro_id', pro.id)
      .in('status', ['confirmed', 'pending_payment'])
      .gte('starts_at', rangeStart)
      .lte('starts_at', rangeEnd)
      .order('starts_at', { ascending: true }),
    admin
      .from('booking_requests')
      .select('id, requested_starts_at, requested_ends_at, status, client_name, client_email, services(name)')
      .eq('pro_id', pro.id)
      .in('status', ['pending', 'accepted'])
      .gte('requested_starts_at', rangeStart)
      .lte('requested_starts_at', rangeEnd)
      .order('requested_starts_at', { ascending: true }),
    admin
      .from('blocked_times')
      .select('id, starts_at, ends_at, label')
      .eq('pro_id', pro.id)
      .gte('starts_at', rangeStart)
      .lte('starts_at', rangeEnd)
      .order('starts_at', { ascending: true }),
    supabase
      .from('availability_rules')
      .select('*')
      .eq('pro_id', pro.id)
      .eq('is_active', true),
    supabase
      .from('services')
      .select('duration_minutes, buffer_minutes')
      .eq('pro_id', pro.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1),
  ]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Link href="/dashboard" className="button" style={{ padding: '0 12px', minHeight: 36, fontSize: 14 }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Calendar</h1>
        </div>

        <ProCalendar
          proId={pro.id}
          timezone={pro.timezone}
          bookings={(bookings ?? []).map((b) => ({
            id: b.id,
            startsAt: b.starts_at,
            endsAt: b.ends_at,
            status: b.status,
            clientName: (b.clients as unknown as { full_name: string } | null)?.full_name ?? 'Client',
            clientEmail: (b.clients as unknown as { email: string } | null)?.email ?? '',
            serviceName: (b.services as unknown as { name: string } | null)?.name ?? 'Session',
          }))}
          requests={(requests ?? []).map((r) => ({
            id: r.id,
            startsAt: r.requested_starts_at,
            endsAt: r.requested_ends_at,
            status: r.status,
            clientName: r.client_name,
            clientEmail: r.client_email,
            serviceName: (r.services as unknown as { name: string } | null)?.name ?? 'Session',
          }))}
          blockedTimes={(blockedTimes ?? []).map((b) => ({
            id: b.id,
            startsAt: b.starts_at,
            endsAt: b.ends_at,
            label: b.label,
          }))}
          availabilityRules={availability ?? []}
          durationMinutes={services?.[0]?.duration_minutes ?? 60}
          bufferMinutes={services?.[0]?.buffer_minutes ?? 0}
        />
      </div>
    </div>
  );
}

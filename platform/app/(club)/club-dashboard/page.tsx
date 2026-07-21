import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CalendarDays, CircleDollarSign, CheckCircle2, ExternalLink, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FacilitySubscriptionCard } from './FacilitySubscriptionCard';

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);
}

type PageProps = { searchParams: Promise<{ subscription?: string }> };

export default async function ClubDashboardPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: club } = await supabase.from('clubs').select('*').eq('user_id', user.id).single();
  if (!club) redirect('/dashboard');

  const [{ data: roster }, { subscription: subscriptionParam }] = await Promise.all([
    supabase.from('pros').select('id').eq('club_id', club.id).eq('status', 'active'),
    searchParams,
  ]);
  const proIds = (roster ?? []).map((p) => p.id);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let upcomingCount = 0;
  let monthRevenueCents = 0;

  if (proIds.length > 0) {
    const [{ count }, { data: monthBookings }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('pro_id', proIds)
        .in('status', ['confirmed', 'pending_payment'])
        .gte('starts_at', now.toISOString()),
      supabase
        .from('bookings')
        .select('price_cents')
        .in('pro_id', proIds)
        .in('status', ['confirmed', 'completed'])
        .gte('starts_at', startOfMonth),
    ]);
    upcomingCount = count ?? 0;
    monthRevenueCents = (monthBookings ?? []).reduce((sum, b) => sum + (b.price_cents ?? 0), 0);
  }

  const fullClubUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io'}/clubs/${club.slug}`;

  return (
    <div className="admin-inner">
      <h1 className="admin-page-title">Welcome back, {club.name}</h1>

      {subscriptionParam === 'success' && (
        <div className="dashboard-banner dashboard-banner--success" style={{ marginBottom: 16 }}>
          <CheckCircle2 size={18} />
          Facility subscription active — all your pros now book at 0% platform fee.
        </div>
      )}

      <FacilitySubscriptionCard
        subscriptionStatus={club.subscription_status}
        seatCount={club.seat_count ?? 0}
        rosterCount={proIds.length}
        hasStripeCustomer={!!club.stripe_customer_id}
      />

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Your public page</h3>
        <div className="dashboard-page-row">
          <div className="profile-url-display">
            <ExternalLink size={15} />
            sessionpro.io/clubs/{club.slug}
          </div>
          <a href={fullClubUrl} target="_blank" rel="noreferrer" className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
            View page
          </a>
        </div>
      </div>

      <div className="admin-kpi-grid" style={{ marginBottom: 16 }}>
        <div className="admin-kpi">
          <div className="admin-kpi-label"><Users size={15} /> Roster</div>
          <div className="admin-kpi-value">{proIds.length}</div>
          <div className="admin-kpi-sub">pros</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-label"><CalendarDays size={15} /> Upcoming sessions</div>
          <div className="admin-kpi-value">{upcomingCount}</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-label"><CircleDollarSign size={15} /> This month</div>
          <div className="admin-kpi-value admin-kpi-value--green">{dollars(monthRevenueCents)}</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Quick actions</h3>
        <div className="dashboard-actions">
          <Link href="/club-dashboard/roster" className="button"><Users size={15} /> Manage roster</Link>
          <Link href="/club-dashboard/bookings" className="button"><CalendarDays size={15} /> View bookings</Link>
          <Link href="/club-dashboard/edit" className="button"><Settings size={15} /> Edit branding</Link>
        </div>
      </div>
    </div>
  );
}

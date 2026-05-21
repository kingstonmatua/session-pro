import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ExternalLink, Calendar, Star, Settings } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!pro) redirect('/onboarding');

  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('pro_id', pro.id);

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('pro_id', pro.id);

  const profileUrl = `sessionpro.io/${pro.slug}`;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">

        <div className="dashboard-welcome">
          <h1>Welcome back, {pro.full_name.split(' ')[0]}</h1>
          <p>Your SessionPro page is {pro.status === 'active' ? 'live and accepting bookings.' : 'currently in draft mode.'}</p>
        </div>

        {/* Profile URL */}
        <div className="dashboard-card" style={{ marginBottom: 16 }}>
          <h3>Your public page</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div className="profile-url-display">
              <ExternalLink size={15} />
              {profileUrl}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                href={`/${pro.slug}`}
                target="_blank"
                className="button"
                style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}
              >
                View page
              </Link>
              <span
                className={`status-badge ${pro.status === 'active' ? 'status-active' : 'status-draft'}`}
              >
                {pro.status === 'active' ? 'Live' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-grid" style={{ marginBottom: 16 }}>
          <div className="dashboard-card">
            <h3>Bookings</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={28} color="var(--green)" />
              <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: 36, fontWeight: 800 }}>
                {bookingCount ?? 0}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>Total bookings received</p>
          </div>

          <div className="dashboard-card">
            <h3>Reviews</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Star size={28} color="var(--amber)" />
              <span style={{ fontFamily: 'var(--font-jakarta)', fontSize: 36, fontWeight: 800 }}>
                {reviewCount ?? 0}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 6 }}>
              {pro.rating_average ? `${pro.rating_average} average rating` : 'No reviews yet'}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="dashboard-card">
          <h3>Quick actions</h3>
          <div className="dashboard-actions">
            <Link href={`/${pro.slug}`} target="_blank" className="button">
              <ExternalLink size={15} /> View public page
            </Link>
            <button className="button" disabled style={{ opacity: 0.5 }}>
              <Settings size={15} /> Edit profile — coming soon
            </button>
            <button className="button" disabled style={{ opacity: 0.5 }}>
              <Calendar size={15} /> Manage bookings — coming soon
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

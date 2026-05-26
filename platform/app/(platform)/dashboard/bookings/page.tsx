import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ArrowLeft, CalendarDays, CircleDollarSign, Clock, CalendarArrowDown } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CancelButton } from './CancelButton';

function formatBookingTime(utcIso: string, timezone: string) {
  const date = new Date(utcIso);
  return {
    date: date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

function dollars(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function BookingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: pro } = await supabase
    .from('pros')
    .select('id, full_name, timezone')
    .eq('user_id', user.id)
    .single();

  if (!pro) redirect('/onboarding');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, clients(full_name, email), services(name, duration_minutes)')
    .eq('pro_id', pro.id)
    .in('status', ['confirmed', 'pending_payment'])
    .order('starts_at', { ascending: true });

  const now = new Date().toISOString();
  const upcoming = (bookings ?? []).filter(b => b.starts_at >= now);
  const past = (bookings ?? []).filter(b => b.starts_at < now).reverse();

  const upcomingRevenue = upcoming.reduce((sum, b) => sum + (b.pro_payout_cents ?? 0), 0);
  const totalEarned = past.reduce((sum, b) => sum + (b.pro_payout_cents ?? 0), 0);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-inner">

        <div className="edit-page-header">
          <Link href="/dashboard" className="button" style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <h1>Bookings</h1>
        </div>

        {/* Stats */}
        <div className="bookings-stats">
          <div className="bookings-stat">
            <CalendarDays size={20} color="var(--green)" />
            <strong>{upcoming.length}</strong>
            <span>Upcoming sessions</span>
          </div>
          <div className="bookings-stat">
            <CircleDollarSign size={20} color="var(--green)" />
            <strong>{dollars(upcomingRevenue)}</strong>
            <span>Upcoming revenue</span>
          </div>
          <div className="bookings-stat">
            <Clock size={20} color="var(--ink-soft)" />
            <strong>{past.length}</strong>
            <span>Sessions completed</span>
          </div>
        </div>

        {/* Upcoming */}
        <div className="dashboard-card" style={{ marginBottom: 16 }}>
          <h3>Upcoming sessions</h3>

          {upcoming.length === 0 ? (
            <div className="bookings-empty">
              <p>No upcoming sessions yet.</p>
              <p>Once a client books through your page, they&apos;ll appear here.</p>
            </div>
          ) : (
            <>
              <div className="bookings-header-row">
                <span>Date &amp; time</span>
                <span>Client</span>
                <span>Session</span>
                <span>Your payout</span>
                <span></span>
              </div>
              <div className="bookings-list">
                {upcoming.map(booking => {
                  const { date, time } = formatBookingTime(booking.starts_at, pro.timezone);
                  return (
                    <div key={booking.id} className="booking-row">
                      <div className="booking-cell">
                        <strong>{date}</strong>
                        <span>{time}</span>
                      </div>
                      <div className="booking-cell">
                        <strong>{booking.clients?.full_name ?? '—'}</strong>
                        <span>{booking.clients?.email ?? '—'}</span>
                      </div>
                      <div className="booking-cell">
                        <strong>{booking.services?.name ?? '—'}</strong>
                        <span>{booking.services?.duration_minutes} min</span>
                      </div>
                      <div className="booking-cell">
                        <strong>{dollars(booking.pro_payout_cents)}</strong>
                      </div>
                      <div className="booking-cell-actions">
                        <span className="status-badge status-confirmed">Confirmed</span>
                        <a
                          href={`/api/bookings/${booking.id}/ical`}
                          className="button"
                          style={{ fontSize: 13, minHeight: 32, padding: '0 12px' }}
                          title="Add to calendar"
                        >
                          <CalendarArrowDown size={14} />
                        </a>
                        <CancelButton
                          bookingId={booking.id}
                          clientName={booking.clients?.full_name ?? 'Client'}
                          sessionName={booking.services?.name ?? 'session'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Past */}
        <div className="dashboard-card">
          <h3>Past sessions</h3>

          {past.length === 0 ? (
            <div className="bookings-empty">
              <p>No past sessions yet.</p>
            </div>
          ) : (
            <>
              <div className="bookings-header-row">
                <span>Date &amp; time</span>
                <span>Client</span>
                <span>Session</span>
                <span>Your payout</span>
                <span></span>
              </div>
              <div className="bookings-list">
                {past.map(booking => {
                  const { date, time } = formatBookingTime(booking.starts_at, pro.timezone);
                  return (
                    <div key={booking.id} className="booking-row booking-row--past">
                      <div className="booking-cell">
                        <strong>{date}</strong>
                        <span>{time}</span>
                      </div>
                      <div className="booking-cell">
                        <strong>{booking.clients?.full_name ?? '—'}</strong>
                        <span>{booking.clients?.email ?? '—'}</span>
                      </div>
                      <div className="booking-cell">
                        <strong>{booking.services?.name ?? '—'}</strong>
                        <span>{booking.services?.duration_minutes} min</span>
                      </div>
                      <div className="booking-cell">
                        <strong>{dollars(booking.pro_payout_cents)}</strong>
                      </div>
                      <div className="booking-cell-actions">
                        <span className="status-badge status-past">Completed</span>
                        <a
                          href={`/api/bookings/${booking.id}/ical`}
                          className="button"
                          style={{ fontSize: 13, minHeight: 32, padding: '0 12px' }}
                          title="Add to calendar"
                        >
                          <CalendarArrowDown size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bookings-total">
                <span>Total earned</span>
                <strong>{dollars(totalEarned)}</strong>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

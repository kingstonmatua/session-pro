import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ArrowLeft, CalendarDays, CircleDollarSign, Clock, CalendarArrowDown, Package } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CancelButton } from './CancelButton';
import { NoShowButton } from './NoShowButton';
import { RescheduleButton } from './RescheduleButton';
import { SendLinkButton } from './SendLinkButton';
import { RequestActionButtons } from './RequestActionButtons';

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

  const [{ data: bookings }, { data: enrollments }, { data: pendingRequests }] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, clients(full_name, email), services(name, duration_minutes)')
      .eq('pro_id', pro.id)
      .in('status', ['confirmed', 'pending_payment', 'completed', 'no_show'])
      .order('starts_at', { ascending: true }),
    supabase
      .from('package_enrollments')
      .select('id, sessions_total, sessions_used, clients(full_name, email), services(name)')
      .eq('pro_id', pro.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('booking_requests')
      .select('id, client_name, client_email, requested_starts_at, requested_ends_at, services(name)')
      .eq('pro_id', pro.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ]);

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

        {/* Pending booking requests */}
        {(pendingRequests ?? []).length > 0 && (
          <div className="dashboard-card" style={{ marginBottom: 16, borderColor: 'var(--amber)' }}>
            <h3 style={{ color: 'var(--amber)' }}>Pending requests ({pendingRequests!.length})</h3>
            <div className="bookings-list">
              {pendingRequests!.map((req) => {
                const service = req.services as unknown as { name: string } | null;
                const { date, time } = formatBookingTime(req.requested_starts_at, pro.timezone);
                return (
                  <div key={req.id} id={`request-${req.id}`} className="booking-row" style={{ gridTemplateColumns: '2fr 2fr 2fr auto' }}>
                    <span>
                      <strong style={{ fontSize: 14 }}>{date}</strong>
                      <br /><span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{time}</span>
                    </span>
                    <span>
                      <strong style={{ fontSize: 14 }}>{req.client_name}</strong>
                      <br /><span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{req.client_email}</span>
                    </span>
                    <span style={{ fontSize: 13 }}>{service?.name ?? '—'}</span>
                    <RequestActionButtons requestId={req.id} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                        <RescheduleButton
                          bookingId={booking.id}
                          clientName={booking.clients?.full_name ?? 'Client'}
                          sessionName={booking.services?.name ?? 'session'}
                        />
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

        {/* Package Enrollments */}
        {(enrollments ?? []).length > 0 && (
          <div className="dashboard-card" style={{ marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} color="var(--green)" /> Active packages
            </h3>
            <div className="bookings-header-row">
              <span>Client</span>
              <span>Package</span>
              <span>Sessions</span>
              <span></span>
            </div>
            <div className="bookings-list">
              {(enrollments ?? []).map(enrollment => {
                const client = enrollment.clients as unknown as { full_name: string; email: string } | null;
                const service = enrollment.services as unknown as { name: string } | null;
                const remaining = enrollment.sessions_total - enrollment.sessions_used;
                return (
                  <div key={enrollment.id} className="booking-row">
                    <div className="booking-cell">
                      <strong>{client?.full_name ?? '—'}</strong>
                      <span>{client?.email ?? '—'}</span>
                    </div>
                    <div className="booking-cell">
                      <strong>{service?.name ?? '—'}</strong>
                    </div>
                    <div className="booking-cell">
                      <strong>{enrollment.sessions_used} of {enrollment.sessions_total} used</strong>
                      <span>{remaining} remaining</span>
                    </div>
                    <div className="booking-cell-actions">
                      <SendLinkButton enrollmentId={enrollment.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                        {booking.status === 'no_show' ? (
                          <span className="status-badge status-noshow">No-show</span>
                        ) : booking.status === 'confirmed' ? (
                          <>
                            <NoShowButton
                              bookingId={booking.id}
                              clientName={booking.clients?.full_name ?? 'Client'}
                              sessionName={booking.services?.name ?? 'session'}
                            />
                          </>
                        ) : (
                          <span className="status-badge status-past">Completed</span>
                        )}
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

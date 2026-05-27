import { AlertTriangle, CalendarDays, Clock, MapPin, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { CancelConfirmButton } from './CancelConfirmButton';

type PageProps = {
  searchParams: Promise<{ booking_id?: string }>;
};

export default async function BookingCancelPage({ searchParams }: PageProps) {
  const { booking_id } = await searchParams;

  // No booking_id = came from Stripe checkout cancel redirect
  if (!booking_id) {
    return (
      <main>
        <section className="booking-status-page">
          <div className="booking-status-card">
            <XCircle size={48} className="booking-status-icon booking-status-icon--cancel" />
            <h1>Payment cancelled</h1>
            <p>No charge was made. Your time slot has been released — head back to try again.</p>
            <div className="booking-confirm-actions">
              <Link href="javascript:history.back()" className="button button-primary">
                Go back
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <InvalidLink />;
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, starts_at, ends_at, pros(full_name, timezone, club_or_business, slug), services(name)')
    .eq('id', booking_id)
    .single();

  if (!booking) return <InvalidLink />;

  const pro = booking.pros as unknown as { full_name: string; timezone: string; club_or_business: string | null; slug: string };
  const service = booking.services as unknown as { name: string };

  const start = new Date(booking.starts_at);
  const end = new Date(booking.ends_at);
  const tz = pro.timezone;

  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(start);

  const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);

  const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  const alreadyCancelled = booking.status === 'cancelled';
  const windowPassed = !alreadyCancelled && hoursUntil < 24;
  const canCancel = !alreadyCancelled && !windowPassed;

  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card booking-status-card--detailed">
          {alreadyCancelled
            ? <XCircle size={52} style={{ color: '#9ca3af' }} />
            : <AlertTriangle size={52} style={{ color: '#d97706' }} />}

          <h1>
            {alreadyCancelled
              ? 'Already cancelled'
              : windowPassed
              ? 'Cancellation window closed'
              : 'Cancel your booking?'}
          </h1>

          <p>
            {alreadyCancelled
              ? 'This booking has already been cancelled.'
              : windowPassed
              ? 'Cancellations must be made at least 24 hours before the session.'
              : 'Please review your booking details. A full refund will be issued immediately.'}
          </p>

          <div className="booking-confirm-details">
            <div className="booking-confirm-row">
              <User size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Instructor</span>
              <span className="booking-confirm-row-value">{pro.full_name}</span>
            </div>
            <div className="booking-confirm-row">
              <CalendarDays size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Session</span>
              <span className="booking-confirm-row-value">{service.name}</span>
            </div>
            <div className="booking-confirm-row">
              <CalendarDays size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Date</span>
              <span className="booking-confirm-row-value">{dateStr}</span>
            </div>
            <div className="booking-confirm-row">
              <Clock size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Time</span>
              <span className="booking-confirm-row-value">{fmtTime(start)} – {fmtTime(end)}</span>
            </div>
            {pro.club_or_business && (
              <div className="booking-confirm-row">
                <MapPin size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">Location</span>
                <span className="booking-confirm-row-value">{pro.club_or_business}</span>
              </div>
            )}
          </div>

          <div className="booking-confirm-actions">
            {canCancel && <CancelConfirmButton bookingId={booking_id} />}
            <Link href={`/${pro.slug}`} className="booking-confirm-back-link">
              Back to profile
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function InvalidLink() {
  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card">
          <XCircle size={52} style={{ color: '#9ca3af' }} />
          <h1>Link not found</h1>
          <p>This cancellation link is invalid or has expired.</p>
          <div className="booking-confirm-actions">
            <Link href="/" className="button button-primary">Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

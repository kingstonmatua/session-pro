import { AlertTriangle, CalendarDays, Clock, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { RescheduleRequestForm } from './RescheduleRequestForm';
import type { AvailabilityRule } from '@/types/sessionpro';

type PageProps = {
  searchParams: Promise<{ booking_id?: string }>;
};

export default async function RescheduleRequestPage({ searchParams }: PageProps) {
  const { booking_id } = await searchParams;

  if (!booking_id || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <InvalidLink />;
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, starts_at, ends_at, pros(id, slug, full_name, timezone), services(name, duration_minutes, buffer_minutes, reschedule_window_hours, client_reschedule_limit)')
    .eq('id', booking_id)
    .single();

  if (!booking) return <InvalidLink />;

  const pro = booking.pros as unknown as { id: string; slug: string; full_name: string; timezone: string };
  const service = booking.services as unknown as {
    name: string; duration_minutes: number; buffer_minutes: number;
    reschedule_window_hours: number; client_reschedule_limit: number;
  };

  const { data: availabilityRules } = await admin
    .from('availability_rules')
    .select('*')
    .eq('pro_id', pro.id)
    .eq('is_active', true)
    .returns<AvailabilityRule[]>();

  const { count: clientRequestCount } = await admin
    .from('reschedule_requests')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', booking_id)
    .eq('initiated_by', 'client')
    .neq('status', 'declined');

  const start = new Date(booking.starts_at);
  const tz = pro.timezone;
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(start);
  const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);

  const hoursUntil = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  const alreadyResolved = booking.status !== 'confirmed' && booking.status !== 'pending_payment';
  const windowPassed = !alreadyResolved && hoursUntil < service.reschedule_window_hours;
  const limitReached = !alreadyResolved && (clientRequestCount ?? 0) >= service.client_reschedule_limit;
  const canRequest = !alreadyResolved && !windowPassed && !limitReached;

  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card booking-status-card--detailed">
          {canRequest
            ? <CalendarDays size={52} style={{ color: '#d97706' }} />
            : <AlertTriangle size={52} style={{ color: alreadyResolved ? '#9ca3af' : '#d97706' }} />}

          <h1>
            {alreadyResolved
              ? 'This booking can no longer be rescheduled'
              : windowPassed
              ? 'Reschedule window closed'
              : limitReached
              ? 'Reschedule limit reached'
              : 'Request a new time'}
          </h1>

          <p>
            {alreadyResolved
              ? 'This booking is cancelled or already resolved.'
              : windowPassed
              ? `Reschedule requests must be made at least ${service.reschedule_window_hours} hours before the session.`
              : limitReached
              ? 'You have already used your reschedule request for this booking. Contact your instructor directly if you need another change.'
              : 'Pick a new time below. Your instructor will need to approve the change before it’s confirmed.'}
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
              <span className="booking-confirm-row-label">Current date</span>
              <span className="booking-confirm-row-value">{dateStr}</span>
            </div>
            <div className="booking-confirm-row">
              <Clock size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Current time</span>
              <span className="booking-confirm-row-value">{fmtTime(start)}</span>
            </div>
          </div>

          {canRequest && (
            <RescheduleRequestForm
              bookingId={booking.id}
              proId={pro.id}
              timezone={pro.timezone}
              availability={availabilityRules ?? []}
              durationMinutes={service.duration_minutes}
              bufferMinutes={service.buffer_minutes}
            />
          )}

          <div className="booking-confirm-actions">
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
          <p>This reschedule link is invalid or has expired.</p>
          <div className="booking-confirm-actions">
            <Link href="/" className="button button-primary">Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

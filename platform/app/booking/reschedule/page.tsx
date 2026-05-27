import { CheckCircle2, Clock, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { RescheduleActionButton } from './RescheduleActionButton';

type PageProps = {
  searchParams: Promise<{ request_id?: string; action?: string }>;
};

export default async function ReschedulePage({ searchParams }: PageProps) {
  const { request_id, action } = await searchParams;

  if (!request_id || (action !== 'accept' && action !== 'decline')) {
    return <InvalidLink />;
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return <InvalidLink />;

  const admin = createAdminClient();

  const { data: req } = await admin
    .from('reschedule_requests')
    .select('*, bookings(starts_at, ends_at, pros(full_name, timezone, club_or_business, slug), services(name))')
    .eq('id', request_id)
    .single();

  if (!req) return <InvalidLink />;

  const booking = req.bookings as {
    starts_at: string; ends_at: string;
    pros: { full_name: string; timezone: string; club_or_business: string | null; slug: string };
    services: { name: string };
  };

  if (req.status !== 'pending') {
    const already = req.status === 'accepted' ? 'accepted' : 'declined';
    return (
      <main>
        <section className="booking-status-page">
          <div className="booking-status-card">
            {req.status === 'accepted'
              ? <CheckCircle2 size={52} color="var(--green)" />
              : <XCircle size={52} style={{ color: '#9ca3af' }} />}
            <h1>Already {already}</h1>
            <p>This reschedule request has already been {already}.</p>
            <div className="booking-confirm-actions">
              <Link href={`/${booking.pros.slug}`} className="button button-primary">Back to profile</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const tz = booking.pros.timezone;

  function fmtDateTime(iso: string) {
    const d = new Date(iso);
    return {
      date: new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d),
      time: new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(d),
    };
  }

  const current = fmtDateTime(booking.starts_at);
  const proposed = fmtDateTime(req.new_starts_at);

  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card booking-status-card--detailed">
          <Clock size={52} style={{ color: 'var(--amber)' }} />
          <h1>{action === 'accept' ? 'Accept reschedule?' : 'Decline reschedule?'}</h1>
          <p>
            {action === 'accept'
              ? `${booking.pros.full_name} has proposed a new time. Review the change below.`
              : `You're declining the reschedule. Your session stays at the original time.`}
          </p>

          <div className="booking-confirm-details">
            <div className="booking-confirm-row">
              <User size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Instructor</span>
              <span className="booking-confirm-row-value">{booking.pros.full_name}</span>
            </div>
            <div className="booking-confirm-row">
              <Clock size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Current time</span>
              <span className="booking-confirm-row-value">{current.date} · {current.time}</span>
            </div>
            {action === 'accept' && (
              <div className="booking-confirm-row reschedule-proposed-row">
                <Clock size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">New time</span>
                <span className="booking-confirm-row-value">{proposed.date} · {proposed.time}</span>
              </div>
            )}
          </div>

          <div className="booking-confirm-actions">
            <RescheduleActionButton requestId={request_id} action={action as 'accept' | 'decline'} proSlug={booking.pros.slug} />
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

import { XCircle, RefreshCw, User, Clock } from 'lucide-react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { RecurringActionButton } from './RecurringActionButton';

type PageProps = {
  searchParams: Promise<{ id?: string; action?: string }>;
};

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Every two weeks',
  monthly: 'Monthly',
};

export default async function RecurringPage({ searchParams }: PageProps) {
  const { id, action } = await searchParams;

  if (!id || !process.env.SUPABASE_SERVICE_ROLE_KEY) return <InvalidLink />;

  const validActions = ['accept', 'decline', 'cancel'];
  if (action && !validActions.includes(action)) return <InvalidLink />;

  const admin = createAdminClient();

  const { data: recurring } = await admin
    .from('recurring_bookings')
    .select('id, client_name, frequency, status, next_starts_at, pros(full_name, timezone, slug), services(name)')
    .eq('id', id)
    .single();

  if (!recurring) return <InvalidLink />;

  const pro = recurring.pros as unknown as { full_name: string; timezone: string; slug: string };
  const service = recurring.services as unknown as { name: string };
  const { status } = recurring;

  function fmtDate(iso: string) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: pro.timezone,
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(d);
  }
  function fmtTime(iso: string) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: pro.timezone,
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(d);
  }

  // Already handled
  if ((action === 'accept' || action === 'decline') && status !== 'pending_client') {
    const was = status === 'active' ? 'accepted' : 'declined';
    return (
      <main>
        <section className="booking-status-page">
          <div className="booking-status-card">
            <XCircle size={52} style={{ color: '#9ca3af' }} />
            <h1>Already {was}</h1>
            <p>This recurring invite has already been {was}.</p>
            <div className="booking-confirm-actions">
              <Link href={`/${pro.slug}`} className="button button-primary">Back to profile</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (action === 'cancel' && status === 'cancelled') {
    return (
      <main>
        <section className="booking-status-page">
          <div className="booking-status-card">
            <XCircle size={52} style={{ color: '#9ca3af' }} />
            <h1>Already cancelled</h1>
            <p>Recurring sessions for this booking have already been cancelled.</p>
            <div className="booking-confirm-actions">
              <Link href={`/${pro.slug}`} className="button button-primary">Back to profile</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const resolvedAction = (action as 'accept' | 'decline' | 'cancel' | undefined)
    ?? (status === 'active' ? 'cancel' : 'accept');

  const headings = {
    accept: 'Accept recurring sessions?',
    decline: 'Decline this invite?',
    cancel: 'Cancel recurring sessions?',
  };
  const descriptions = {
    accept: `You'll receive a payment link 48 hours before each session. Pay to confirm each one.`,
    decline: `You're declining the recurring invite. No sessions will be scheduled.`,
    cancel: `You're cancelling your recurring ${service.name} sessions. No more payment links will be sent.`,
  };

  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card booking-status-card--detailed">
          <RefreshCw size={52} color="var(--green)" />
          <h1>{headings[resolvedAction]}</h1>
          <p>{descriptions[resolvedAction]}</p>

          <div className="booking-confirm-details">
            <div className="booking-confirm-row">
              <User size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Instructor</span>
              <span className="booking-confirm-row-value">{pro.full_name}</span>
            </div>
            <div className="booking-confirm-row">
              <RefreshCw size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Session</span>
              <span className="booking-confirm-row-value">{service.name}</span>
            </div>
            <div className="booking-confirm-row">
              <Clock size={15} className="booking-confirm-row-icon" />
              <span className="booking-confirm-row-label">Frequency</span>
              <span className="booking-confirm-row-value">{FREQUENCY_LABEL[recurring.frequency]}</span>
            </div>
            {resolvedAction !== 'cancel' && (
              <div className="booking-confirm-row">
                <Clock size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">First session</span>
                <span className="booking-confirm-row-value">
                  {fmtDate(recurring.next_starts_at)} · {fmtTime(recurring.next_starts_at)}
                </span>
              </div>
            )}
          </div>

          <div className="booking-confirm-actions">
            {resolvedAction === 'accept' && (
              <Link href={`/booking/recurring?id=${id}&action=decline`} className="button">
                Decline
              </Link>
            )}
            <RecurringActionButton id={id} action={resolvedAction} proSlug={pro.slug} />
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
          <p>This link is invalid or has expired.</p>
          <div className="booking-confirm-actions">
            <Link href="/" className="button button-primary">Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

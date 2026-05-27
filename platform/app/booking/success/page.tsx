import { CalendarDays, CheckCircle2, Clock, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

type BookingDetails = {
  proName: string;
  proSlug: string;
  serviceName: string;
  dateStr: string;
  timeStr: string;
  location: string | null;
};

async function fetchBookingDetailsByBookingId(bookingId: string): Promise<BookingDetails | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const supabase = createAdminClient();
    const { data: booking } = await supabase
      .from('bookings')
      .select('starts_at, ends_at, pros(full_name, timezone, club_or_business, slug), services(name)')
      .eq('id', bookingId)
      .single();

    if (!booking) return null;
    const pro = booking.pros as unknown as { full_name: string; timezone: string; club_or_business: string | null; slug: string };
    const service = booking.services as unknown as { name: string };
    const tz = pro.timezone;
    const start = new Date(booking.starts_at);
    const end = new Date(booking.ends_at);

    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }).format(start);

    const fmtTime = (d: Date) =>
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }).format(d);

    return {
      proName: pro.full_name,
      proSlug: pro.slug,
      serviceName: service.name,
      dateStr,
      timeStr: `${fmtTime(start)} – ${fmtTime(end)}`,
      location: pro.club_or_business ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchBookingDetails(sessionId: string): Promise<BookingDetails | null> {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const { holdId, proId, serviceId, proSlug } = session.metadata ?? {};
    if (!holdId || !proId || !serviceId) return null;

    const supabase = createAdminClient();
    const [{ data: hold }, { data: pro }, { data: service }] = await Promise.all([
      supabase.from('booking_holds').select('starts_at, ends_at').eq('id', holdId).single(),
      supabase.from('pros').select('full_name, timezone, club_or_business, slug').eq('id', proId).single(),
      supabase.from('services').select('name, duration_minutes').eq('id', serviceId).single(),
    ]);

    if (!hold || !pro || !service) return null;

    const tz = pro.timezone;
    const start = new Date(hold.starts_at);
    const end = new Date(hold.ends_at);

    const dateStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(start);

    const fmtTime = (d: Date) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);

    return {
      proName: pro.full_name,
      proSlug: (pro.slug as string | null) ?? (proSlug as string),
      serviceName: service.name,
      dateStr,
      timeStr: `${fmtTime(start)} – ${fmtTime(end)}`,
      location: (pro.club_or_business as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

type PageProps = {
  searchParams: Promise<{ proSlug?: string; session_id?: string; booking_id?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { proSlug, session_id, booking_id } = await searchParams;

  const details = session_id
    ? await fetchBookingDetails(session_id)
    : booking_id
    ? await fetchBookingDetailsByBookingId(booking_id)
    : null;
  const backSlug = details?.proSlug ?? proSlug;

  return (
    <main>
      <section className="booking-status-page">
        <div className={`booking-status-card${details ? ' booking-status-card--detailed' : ''}`}>
          <CheckCircle2
            size={52}
            className="booking-status-icon booking-status-icon--success"
          />
          <h1>You&rsquo;re booked!</h1>
          <p>
            Your session is confirmed. Check your email for a receipt and any
            details from your instructor.
          </p>

          {details && (
            <div className="booking-confirm-details">
              <div className="booking-confirm-row">
                <User size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">Instructor</span>
                <span className="booking-confirm-row-value">{details.proName}</span>
              </div>
              <div className="booking-confirm-row">
                <CalendarDays size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">Session</span>
                <span className="booking-confirm-row-value">{details.serviceName}</span>
              </div>
              <div className="booking-confirm-row">
                <CalendarDays size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">Date</span>
                <span className="booking-confirm-row-value">{details.dateStr}</span>
              </div>
              <div className="booking-confirm-row">
                <Clock size={15} className="booking-confirm-row-icon" />
                <span className="booking-confirm-row-label">Time</span>
                <span className="booking-confirm-row-value">{details.timeStr}</span>
              </div>
              {details.location && (
                <div className="booking-confirm-row">
                  <MapPin size={15} className="booking-confirm-row-icon" />
                  <span className="booking-confirm-row-label">Location</span>
                  <span className="booking-confirm-row-value">{details.location}</span>
                </div>
              )}
            </div>
          )}

          <div className="booking-confirm-actions">
            {details && session_id && (
              <a
                href={`/api/booking-ical?session_id=${session_id}`}
                className="button button-primary"
                download
              >
                Add to calendar
              </a>
            )}
            {backSlug ? (
              <Link
                href={`/${backSlug}`}
                className={details ? 'booking-confirm-back-link' : 'button button-primary'}
              >
                Back to profile
              </Link>
            ) : (
              <Link
                href="/"
                className={details ? 'booking-confirm-back-link' : 'button button-primary'}
              >
                Back to home
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import { CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { BookingCalendar } from './BookingCalendar';
import { centsToDollars, formatAvailability } from '@/lib/profiles';
import type { AvailabilityRule, EnrollmentMode, Pro, Service } from '@/types/sessionpro';

type Props = {
  pro: Pro;
  services: Service[];
  availability: AvailabilityRule[];
  demoPaymentLink?: string;
  enrollmentMode?: EnrollmentMode | null;
  bookingMode?: 'instant' | 'request';
};

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BookingFlow({ pro, services, availability, demoPaymentLink, enrollmentMode, bookingMode }: Props) {
  const isRequestMode = bookingMode === 'request' && !enrollmentMode && !demoPaymentLink;
  const singles = services.filter((s) => s.kind === 'single');
  const packages = services.filter((s) => s.kind === 'package');

  const [selectedService, setSelectedService] = useState<Service | null>(
    enrollmentMode?.service ?? singles[0] ?? null
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request mode fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const canCheckout = selectedService !== null && selectedDate !== null && selectedTime !== null;

  function formatDate(date: Date): string {
    return `${DAYS_LONG[date.getDay()]}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}`;
  }

  function handleDateSelect(date: Date | null) {
    setSelectedDate(date);
    setSelectedTime(null);
  }

  const dateStr = selectedDate ? [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, '0'),
    String(selectedDate.getDate()).padStart(2, '0'),
  ].join('-') : '';

  async function handleSubmitRequest() {
    if (!canCheckout || !clientName.trim() || !clientEmail.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proId: pro.id,
          serviceId: selectedService!.id,
          date: dateStr,
          timeSlot: selectedTime,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
      }
      setRequestSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setIsLoading(false);
  }

  async function handleProceedToPayment() {
    if (!canCheckout) return;

    setIsLoading(true);
    setError(null);

    if (enrollmentMode) {
      try {
        const res = await fetch(`/api/enrollments/${enrollmentMode.id}/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, timeSlot: selectedTime }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'Something went wrong. Please try again.');
        }
        const { bookingId } = await res.json();
        window.location.href = `/booking/success?proSlug=${pro.slug}&booking_id=${bookingId}`;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
        setIsLoading(false);
      }
      return;
    }

    if (demoPaymentLink) {
      window.location.href = demoPaymentLink;
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proId: pro.id,
          serviceId: selectedService!.id,
          date: dateStr,
          timeSlot: selectedTime,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong. Please try again.');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  const sessionLabel = enrollmentMode
    ? `Session ${enrollmentMode.sessionsUsed + 1} of ${enrollmentMode.sessionsTotal}`
    : null;

  const mobileTimeLabel = selectedDate && selectedTime
    ? `${DAYS_LONG[selectedDate.getDay()].slice(0, 3)} ${MONTHS_LONG[selectedDate.getMonth()].slice(0, 3)} ${selectedDate.getDate()} · ${selectedTime}`
    : selectedDate
    ? `${DAYS_LONG[selectedDate.getDay()].slice(0, 3)} ${MONTHS_LONG[selectedDate.getMonth()].slice(0, 3)} ${selectedDate.getDate()} — pick a time`
    : 'Select a date & time';

  return (
    <>
    {canCheckout && (
      <div className="mobile-checkout-bar">
        <div className="mobile-checkout-bar-info">
          <div className="mobile-checkout-bar-service">
            {sessionLabel ?? selectedService!.name}
          </div>
          <div className="mobile-checkout-bar-time">{mobileTimeLabel}</div>
        </div>
        {!isRequestMode && (
          <button
            className="button button-primary"
            type="button"
            onClick={handleProceedToPayment}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={15} className="slots-spinner" /> : null}
            {isLoading
              ? 'Booking…'
              : enrollmentMode
              ? 'Book session'
              : `Pay ${centsToDollars(selectedService!.price_cents)}`}
          </button>
        )}
      </div>
    )}
    <div className="container booking-grid">
      <div>
        {enrollmentMode ? (
          <section className="panel">
            <div className="section-heading">
              <span>01</span>
              <div>
                <h2>{enrollmentMode.service.name}</h2>
                <p>Session {enrollmentMode.sessionsUsed + 1} of {enrollmentMode.sessionsTotal} &mdash; already paid. Pick a date and time below.</p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="panel">
              <div className="section-heading">
                <span>01</span>
                <div>
                  <h2>Choose a session</h2>
                  <p>Select the lesson that fits your game. Packages are available for clients who want consistent progress.</p>
                </div>
              </div>
              <div className="service-grid">
                {singles.map((service) => (
                  <article
                    key={service.id}
                    className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                    onClick={() => setSelectedService(service)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedService(service)}
                  >
                    <div className="service-topline">
                      <div>
                        <div className="service-name">{service.name}</div>
                        <div className="service-detail">{service.duration_minutes} minutes · {service.level}</div>
                      </div>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="price">{centsToDollars(service.price_cents)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="section panel">
              <div className="section-heading">
                <span>02</span>
                <div>
                  <h2>Packages</h2>
                  <p>Save when you book multiple lessons up front.</p>
                </div>
              </div>
              <div className="service-grid">
                {packages.map((service) => {
                  const savings = service.compare_at_price_cents
                    ? service.compare_at_price_cents - service.price_cents
                    : 0;
                  return (
                    <article
                      key={service.id}
                      className={`service-card package ${selectedService?.id === service.id ? 'selected' : ''}`}
                      onClick={() => setSelectedService(service)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedService(service)}
                    >
                      <div className="service-topline">
                        <div>
                          <div className="service-name">
                            {service.name}{service.level ? ` (${service.level})` : ''}
                          </div>
                          <div className="service-detail">
                            {service.session_count} sessions · {centsToDollars(Math.round(service.price_cents / service.session_count))}/session
                          </div>
                        </div>
                        {savings > 0 && <span className="savings">Save {centsToDollars(savings)}</span>}
                      </div>
                      <div className="price">{centsToDollars(service.price_cents)}</div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <section className="section panel">
          <div className="section-heading">
            <span>{enrollmentMode ? '02' : '03'}</span>
            <div>
              <h2>{sessionLabel ? `Book ${sessionLabel}` : 'Select a date and time'}</h2>
              <p>Pick a date and time at {pro.club_or_business ?? 'the location'}.</p>
            </div>
          </div>
          <BookingCalendar
            proId={pro.id}
            timezone={pro.timezone}
            availability={availability}
            durationMinutes={selectedService?.duration_minutes ?? 60}
            bufferMinutes={selectedService?.buffer_minutes ?? 15}
            onDateSelect={handleDateSelect}
            onTimeSelect={setSelectedTime}
          />
        </section>
      </div>

      <aside className="booking-panel">
        <div className="booking-panel-header">
          <div>
            <span>Booking summary</span>
            <h2>Reserve your lesson</h2>
          </div>
          <CalendarDays size={22} />
        </div>

        <div className="summary-row">
          <span>Instructor</span>
          <strong>{pro.full_name}</strong>
        </div>
        <div className="summary-row">
          <span>Session</span>
          <strong>{sessionLabel ?? selectedService?.name ?? '—'}</strong>
        </div>
        <div className="summary-row">
          <span>Date</span>
          <strong>{selectedDate ? formatDate(selectedDate) : '—'}</strong>
        </div>
        <div className="summary-row">
          <span>Time</span>
          <strong>{selectedTime ?? '—'}</strong>
        </div>
        <div className="summary-row">
          <span>Location</span>
          <strong>{pro.club_or_business ?? '—'}</strong>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <strong>{enrollmentMode ? 'Included in package' : isRequestMode ? 'Review by pro' : selectedService ? centsToDollars(selectedService.price_cents) : '—'}</strong>
        </div>

        {error && <p className="booking-error">{error}</p>}

        {isRequestMode ? (
          requestSent ? (
            <div className="booking-request-sent">
              <CheckCircle2 size={20} color="var(--green)" />
              <div>
                <strong>Request sent!</strong>
                <p>{pro.full_name} will review and send you a payment link if accepted.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="booking-request-fields">
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <input
                  className="form-input"
                  type="email"
                  placeholder="Your email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <button
                className="button button-primary booking-button"
                type="button"
                onClick={handleSubmitRequest}
                disabled={!canCheckout || !clientName.trim() || !clientEmail.trim() || isLoading}
              >
                {isLoading ? <><Loader2 size={16} className="slots-spinner" /> Sending…</> : 'Request booking'}
              </button>
              <p className="fine-print">Your request goes to {pro.full_name} for review. No charge until accepted.</p>
            </>
          )
        ) : (
          <>
            <button
              className="button button-primary booking-button"
              type="button"
              onClick={handleProceedToPayment}
              disabled={!canCheckout || isLoading}
            >
              {isLoading
                ? <><Loader2 size={16} className="slots-spinner" /> {enrollmentMode ? 'Booking…' : 'Redirecting to payment…'}</>
                : enrollmentMode ? 'Book session' : 'Proceed to payment'
              }
            </button>
            <p className="fine-print">Secure payment via Stripe. Free cancellation 24 hours before session.</p>
          </>
        )}

        <div className="availability-card">
          <div className="availability-title">
            <CalendarDays size={18} />
            Weekly availability
          </div>
          <ul className="availability-list">
            {availability.map((rule) => (
              <li key={rule.id}>
                <span>{formatAvailability(rule).split(' ')[0]}</span>
                <strong>{formatAvailability(rule).split(' ').slice(1).join(' ')}</strong>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
    </>
  );
}

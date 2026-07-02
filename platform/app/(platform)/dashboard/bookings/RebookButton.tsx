'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, RefreshCw } from 'lucide-react';

type Props = {
  bookingId: string;
  clientName: string;
  sessionName: string;
  lastStartsAt: string;
  lastEndsAt: string;
  timezone: string;
};

function toTimeInput(utcIso: string, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcIso));
}

export function RebookButton({ bookingId, clientName, sessionName, lastStartsAt, lastEndsAt, timezone }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function openModal() {
    setError(null);
    setDate('');
    setStartTime(toTimeInput(lastStartsAt, timezone));
    setEndTime(toTimeInput(lastEndsAt, timezone));
    setOpen(true);
  }

  function handleRebook() {
    if (!date || !startTime || !endTime) return;
    setError(null);
    startTransition(async () => {
      const newStartsAt = new Date(`${date}T${startTime}`).toISOString();
      const newEndsAt = new Date(`${date}T${endTime}`).toISOString();
      const res = await fetch(`/api/bookings/${bookingId}/rebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStartsAt, newEndsAt }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
        alert(`Payment link sent to ${clientName}.`);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <>
      <button
        onClick={openModal}
        className="button"
        style={{ fontSize: 13, minHeight: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <RefreshCw size={13} /> Rebook
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rebook {clientName}</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p style={{ marginBottom: 16 }}>
                Pick a new date for <strong>{clientName}</strong>&rsquo;s{' '}
                <strong>{sessionName}</strong> session. They&rsquo;ll receive a payment link to confirm.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    disabled={pending}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>Start time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      disabled={pending}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 4 }}>End time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      disabled={pending}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="cancel-error">{error}</p>}

            <div className="cancel-modal-actions">
              <button className="button" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </button>
              <button
                className="button button-primary"
                onClick={handleRebook}
                disabled={pending || !date || !startTime || !endTime}
              >
                {pending ? 'Sending…' : 'Send payment link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

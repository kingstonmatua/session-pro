'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, CalendarClock } from 'lucide-react';

type Props = { bookingId: string; clientName: string; sessionName: string };

export function RescheduleButton({ bookingId, clientName, sessionName }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleReschedule() {
    if (!date || !startTime || !endTime) return;
    setError(null);
    startTransition(async () => {
      const newStartsAt = new Date(`${date}T${startTime}`).toISOString();
      const newEndsAt = new Date(`${date}T${endTime}`).toISOString();
      const res = await fetch('/api/reschedule-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, newStartsAt, newEndsAt }),
      });
      if (res.ok) {
        setOpen(false);
        setDate(''); setStartTime(''); setEndTime('');
        router.refresh();
        alert('Reschedule request sent to client.');
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setOpen(true); }}
        className="button"
        style={{ fontSize: 13, minHeight: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <CalendarClock size={13} /> Reschedule
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Propose new time</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p style={{ marginBottom: 16 }}>
                Propose a new time for <strong>{clientName}</strong>&rsquo;s{' '}
                <strong>{sessionName}</strong> session. They&rsquo;ll receive an email to accept or decline.
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
                onClick={handleReschedule}
                disabled={pending || !date || !startTime || !endTime}
              >
                {pending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

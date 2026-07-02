'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Repeat2 } from 'lucide-react';

type Props = {
  bookingId: string;
  clientName: string;
  sessionName: string;
};

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every two weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export function InviteRecurringButton({ bookingId, clientName, sessionName }: Props) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState<string>('weekly');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/invite-recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
        alert(`Recurring invite sent to ${clientName}.`);
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
        <Repeat2 size={13} /> Recurring
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set up recurring sessions</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p style={{ marginBottom: 16 }}>
                Invite <strong>{clientName}</strong> to set up recurring{' '}
                <strong>{sessionName}</strong> sessions. They&rsquo;ll receive a payment link 48 hours before each occurrence.
              </p>
              <div>
                <label style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>Frequency</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {FREQUENCY_OPTIONS.map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="frequency"
                        value={opt.value}
                        checked={frequency === opt.value}
                        onChange={() => setFrequency(opt.value)}
                        disabled={pending}
                      />
                      {opt.label}
                    </label>
                  ))}
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
                onClick={handleSend}
                disabled={pending}
              >
                {pending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle } from 'lucide-react';

type Props = { bookingId: string; clientName: string; sessionName: string };

export function CancelButton({ bookingId, clientName, sessionName }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' });
      if (res.ok) {
        setOpen(false);
        router.refresh();
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
        className="button button-danger"
        style={{ fontSize: 13, minHeight: 32, padding: '0 12px' }}
      >
        Cancel
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel booking?</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <div className="cancel-warning-icon">
                <AlertTriangle size={22} color="var(--amber)" />
              </div>
              <p>
                You&rsquo;re about to cancel <strong>{clientName}</strong>&rsquo;s{' '}
                <strong>{sessionName}</strong> session. They&rsquo;ll receive a cancellation email
                and a full refund automatically.
              </p>
              <p className="cancel-note">This cannot be undone.</p>
            </div>

            {error && <p className="cancel-error">{error}</p>}

            <div className="cancel-modal-actions">
              <button
                className="button"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Keep booking
              </button>
              <button
                className="button button-danger"
                onClick={handleCancel}
                disabled={pending}
              >
                {pending ? 'Cancelling…' : 'Yes, cancel & refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

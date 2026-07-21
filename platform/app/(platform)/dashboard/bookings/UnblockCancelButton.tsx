'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle } from 'lucide-react';

type Props = { requestId: string; clientName: string; sessionName: string };

export function UnblockCancelButton({ requestId, clientName, sessionName }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleUnblock() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/booking-requests/${requestId}/unblock`, { method: 'POST' });
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
        className="button"
        style={{ fontSize: 13, minHeight: 34, padding: '0 12px' }}
      >
        Unblock &amp; cancel
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Unblock this slot?</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <div className="cancel-warning-icon">
                <AlertTriangle size={22} color="var(--amber)" />
              </div>
              <p>
                <strong>{clientName}</strong>&rsquo;s <strong>{sessionName}</strong> request never got paid.
                This cancels the request, releases the time slot for other clients, and lets {clientName.split(' ')[0]} know by email.
              </p>
              <p className="cancel-note">This cannot be undone.</p>
            </div>

            {error && <p className="cancel-error">{error}</p>}

            <div className="cancel-modal-actions">
              <button className="button" onClick={() => setOpen(false)} disabled={pending}>
                Keep blocked
              </button>
              <button className="button button-danger" onClick={handleUnblock} disabled={pending}>
                {pending ? 'Unblocking…' : 'Unblock & cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

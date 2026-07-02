'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, UserX } from 'lucide-react';

type Props = { bookingId: string; clientName: string; sessionName: string };

export function NoShowButton({ bookingId, clientName, sessionName }: Props) {
  const [open, setOpen] = useState(false);
  const [refund, setRefund] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleNoShow() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/bookings/${bookingId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund }),
      });
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
        onClick={() => { setError(null); setRefund(false); setOpen(true); }}
        className="button"
        style={{ fontSize: 13, minHeight: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5 }}
      >
        <UserX size={13} /> No-show
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark as no-show?</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p>
                <strong>{clientName}</strong> didn&rsquo;t attend their{' '}
                <strong>{sessionName}</strong> session. They&rsquo;ll receive a notification email.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={refund}
                  onChange={e => setRefund(e.target.checked)}
                  disabled={pending}
                  style={{ width: 15, height: 15, flexShrink: 0 }}
                />
                Issue a full refund
              </label>
              <p className="cancel-note" style={{ marginTop: 10 }}>This cannot be undone.</p>
            </div>

            {error && <p className="cancel-error">{error}</p>}

            <div className="cancel-modal-actions">
              <button className="button" onClick={() => setOpen(false)} disabled={pending}>
                Keep booking
              </button>
              <button className="button button-danger" onClick={handleNoShow} disabled={pending}>
                {pending ? 'Saving…' : 'Mark no-show'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

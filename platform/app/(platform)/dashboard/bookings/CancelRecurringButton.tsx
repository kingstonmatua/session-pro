'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type Props = {
  recurringId: string;
  clientName: string;
};

export function CancelRecurringButton({ recurringId, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/recurring-bookings/${recurringId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Something went wrong.');
      }
    });
  }

  return (
    <>
      <button
        onClick={() => { setError(null); setOpen(true); }}
        className="button"
        style={{ fontSize: 13, minHeight: 32, padding: '0 12px' }}
      >
        Cancel
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !pending && setOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel recurring sessions?</h3>
              <button className="modal-close" onClick={() => !pending && setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="cancel-modal-body">
              <p>
                This will stop scheduling future payment links for <strong>{clientName}</strong>.
                Any sessions already confirmed will not be affected.
              </p>
            </div>
            {error && <p className="cancel-error">{error}</p>}
            <div className="cancel-modal-actions">
              <button className="button" onClick={() => setOpen(false)} disabled={pending}>
                Keep recurring
              </button>
              <button
                className="button button-danger"
                onClick={handleCancel}
                disabled={pending}
              >
                {pending ? 'Cancelling…' : 'Cancel recurring'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

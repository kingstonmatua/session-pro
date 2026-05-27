'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  requestId: string;
  action: 'accept' | 'decline';
  proSlug: string;
};

export function RescheduleActionButton({ requestId, action, proSlug }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleClick() {
    setState('loading');
    try {
      const res = await fetch(`/api/reschedule-requests/${requestId}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Something went wrong.');
      }
      setState('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {action === 'accept'
          ? <><CheckCircle2 size={40} color="var(--green)" /><p style={{ margin: 0 }}>Reschedule confirmed. Check your email for the updated details.</p></>
          : <><XCircle size={40} style={{ color: '#9ca3af' }} /><p style={{ margin: 0 }}>Declined. Your original session time is unchanged.</p></>
        }
        <Link href={`/${proSlug}`} className="button button-primary">Back to profile</Link>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ color: 'var(--amber)', margin: 0 }}>{errorMsg}</p>
        <button className="button" onClick={() => setState('idle')}>Try again</button>
      </div>
    );
  }

  return (
    <>
      <button
        className={`button ${action === 'accept' ? 'button-primary' : ''}`}
        onClick={handleClick}
        disabled={state === 'loading'}
      >
        {state === 'loading'
          ? <><Loader2 size={15} className="slots-spinner" /> Processing…</>
          : action === 'accept' ? 'Yes, accept new time' : 'No, keep original time'
        }
      </button>
      {action === 'accept' && (
        <Link href={`/booking/reschedule?request_id=${requestId}&action=decline`} className="booking-confirm-back-link">
          Decline instead
        </Link>
      )}
    </>
  );
}

'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';

type Props = {
  requestId: string;
};

export function RequestActionButtons({ requestId }: Props) {
  const [state, setState] = useState<'idle' | 'accepting' | 'declining' | 'accepted' | 'declined' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleAccept() {
    setState('accepting');
    setError('');
    try {
      const res = await fetch(`/api/booking-requests/${requestId}/accept`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to accept');
      }
      setState('accepted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setState('error');
    }
  }

  async function handleDecline() {
    setState('declining');
    setError('');
    try {
      const res = await fetch(`/api/booking-requests/${requestId}/decline`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to decline');
      }
      setState('declined');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setState('error');
    }
  }

  if (state === 'accepted') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 13 }}>
        <CheckCircle2 size={15} />
        Payment link sent
      </div>
    );
  }

  if (state === 'declined') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)', fontSize: 13 }}>
        <XCircle size={15} />
        Declined
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--amber)' }}>{error}</p>
        <button className="button" style={{ fontSize: 12 }} onClick={() => setState('idle')}>Retry</button>
      </div>
    );
  }

  const busy = state === 'accepting' || state === 'declining';

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className="button button-primary"
        style={{ fontSize: 13, minHeight: 34, padding: '0 12px' }}
        onClick={handleAccept}
        disabled={busy}
      >
        {state === 'accepting' ? <Loader2 size={13} className="slots-spinner" /> : null}
        Accept
      </button>
      <button
        className="button"
        style={{ fontSize: 13, minHeight: 34, padding: '0 12px', color: 'var(--amber)' }}
        onClick={handleDecline}
        disabled={busy}
      >
        {state === 'declining' ? <Loader2 size={13} className="slots-spinner" /> : null}
        Decline
      </button>
    </div>
  );
}

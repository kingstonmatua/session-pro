'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Props = {
  requestId: string;
};

export function ResendPaymentLinkButton({ requestId }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleResend() {
    setState('sending');
    setError('');
    try {
      const res = await fetch(`/api/booking-requests/${requestId}/resend-payment-link`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to resend');
      }
      setState('sent');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 13 }}>
        <CheckCircle2 size={15} />
        New link sent
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

  return (
    <button
      className="button button-primary"
      style={{ fontSize: 13, minHeight: 34, padding: '0 12px' }}
      onClick={handleResend}
      disabled={state === 'sending'}
    >
      {state === 'sending' ? <Loader2 size={13} className="slots-spinner" /> : null}
      Resend payment link
    </button>
  );
}

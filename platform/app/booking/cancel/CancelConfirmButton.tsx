'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export function CancelConfirmButton({ bookingId }: { bookingId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'cancelled' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCancel() {
    setState('loading');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/client-cancel`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(body.error ?? 'Something went wrong. Please try again.');
        setState('error');
        return;
      }
      setState('cancelled');
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setState('error');
    }
  }

  if (state === 'cancelled') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#374151', marginBottom: 8 }}>Your booking has been cancelled. A full refund has been issued and should appear within 5–10 business days.</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {state === 'error' && (
        <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{errorMsg}</p>
      )}
      <button
        className="button"
        style={{ background: '#dc2626', color: '#fff', borderColor: '#dc2626' }}
        onClick={handleCancel}
        disabled={state === 'loading'}
      >
        {state === 'loading' ? <><Loader2 size={15} className="slots-spinner" /> Cancelling…</> : 'Yes, cancel my booking'}
      </button>
    </div>
  );
}

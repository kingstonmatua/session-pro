'use client';

import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';

export function SendLinkButton({ enrollmentId }: { enrollmentId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function handleSend() {
    setState('loading');
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}/send-link`, { method: 'POST' });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return <span className="status-badge status-confirmed">Link sent</span>;
  }

  if (state === 'error') {
    return <span className="status-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>Failed — retry</span>;
  }

  return (
    <button
      className="button"
      style={{ fontSize: 13, minHeight: 32, padding: '0 12px' }}
      onClick={handleSend}
      disabled={state === 'loading'}
      title="Send booking link to client"
    >
      {state === 'loading' ? <Loader2 size={14} className="slots-spinner" /> : <Send size={14} />}
      Send link
    </button>
  );
}

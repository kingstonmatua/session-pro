'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'publish' | 'reject' | null>(null);

  async function handleAction(action: 'publish' | 'reject') {
    setLoading(action);
    await fetch(`/api/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="admin-review-actions">
      <button
        className="button button-primary"
        style={{ fontSize: 13, minHeight: 32, padding: '0 14px' }}
        onClick={() => handleAction('publish')}
        disabled={loading !== null}
      >
        {loading === 'publish' ? <Loader2 size={13} className="slots-spinner" /> : 'Approve'}
      </button>
      <button
        className="button"
        style={{ fontSize: 13, minHeight: 32, padding: '0 14px', color: '#dc2626', borderColor: '#fca5a5' }}
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
      >
        {loading === 'reject' ? <Loader2 size={13} className="slots-spinner" /> : 'Reject'}
      </button>
    </div>
  );
}

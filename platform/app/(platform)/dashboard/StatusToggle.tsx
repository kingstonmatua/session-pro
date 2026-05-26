'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';

type Props = { status: 'active' | 'draft' };

export function StatusToggle({ status: initial }: Props) {
  const [status, setStatus] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = status === 'active' ? 'draft' : 'active';
    setStatus(next);
    startTransition(async () => {
      const res = await fetch('/api/pro/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setStatus(status); // revert on failure
      }
    });
  }

  const isLive = status === 'active';

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`status-toggle ${isLive ? 'status-toggle--live' : 'status-toggle--draft'}`}
      title={isLive ? 'Click to pause bookings' : 'Click to go live'}
    >
      <Radio size={13} />
      {pending ? '…' : isLive ? 'Live' : 'Draft'}
    </button>
  );
}

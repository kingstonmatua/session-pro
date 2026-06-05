'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, EyeOff } from 'lucide-react';

type Props = { listed: boolean };

export function MarketplaceToggle({ listed: initial }: Props) {
  const [listed, setListed] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !listed;
    setListed(next);
    startTransition(async () => {
      const res = await fetch('/api/pro/marketplace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace_listed: next }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setListed(listed);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`status-toggle ${listed ? 'status-toggle--live' : 'status-toggle--draft'}`}
      title={listed ? 'Listed in marketplace — click to unlist' : 'Not listed in marketplace — click to list'}
    >
      {listed ? <Globe size={13} /> : <EyeOff size={13} />}
      {pending ? '…' : listed ? 'Listed' : 'Unlisted'}
    </button>
  );
}

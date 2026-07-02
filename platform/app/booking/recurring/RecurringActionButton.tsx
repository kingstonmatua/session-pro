'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  id: string;
  action: 'accept' | 'decline' | 'cancel';
  proSlug: string;
};

const LABELS = {
  accept: { idle: 'Accept recurring booking', loading: 'Accepting…' },
  decline: { idle: 'Decline', loading: 'Declining…' },
  cancel: { idle: 'Cancel recurring sessions', loading: 'Cancelling…' },
};

export function RecurringActionButton({ id, action, proSlug }: Props) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/recurring-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Something went wrong. Please try again.');
      }
    });
  }

  if (done) {
    const messages = {
      accept: 'You\'re signed up! You\'ll receive a payment link 48 hours before each session.',
      decline: 'Invite declined. No sessions have been scheduled.',
      cancel: 'Recurring sessions cancelled. No more payment links will be sent.',
    };
    return <p style={{ color: 'var(--ink-soft)', fontSize: 14, textAlign: 'center' }}>{messages[action]}</p>;
  }

  return (
    <>
      <button
        className={`button ${action === 'accept' ? 'button-primary' : ''}`}
        onClick={handleClick}
        disabled={pending}
        style={{ minHeight: 44, fontSize: 15, fontWeight: 700, padding: '0 28px' }}
      >
        {pending ? LABELS[action].loading : LABELS[action].idle}
      </button>
      {error && <p style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>}
    </>
  );
}

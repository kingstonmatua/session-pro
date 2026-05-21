'use client';

import { useState } from 'react';

export function ConnectStripeButton({ label }: { label: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/connect/onboard', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to start Stripe onboarding');
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button className="button button-primary" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Redirecting to Stripe…' : label}
      </button>
      {error && <p style={{ marginTop: 8, fontSize: 13, color: '#dc2626' }}>{error}</p>}
    </div>
  );
}

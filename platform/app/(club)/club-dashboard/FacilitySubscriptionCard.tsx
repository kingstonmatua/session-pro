'use client';

import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';

type Props = {
  subscriptionStatus: string;
  seatCount: number;
  rosterCount: number;
  hasStripeCustomer: boolean;
};

export function FacilitySubscriptionCard({ subscriptionStatus, seatCount, rosterCount, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(interval: 'month' | 'year') {
    setLoading(interval);
    const res = await fetch('/api/subscriptions/facility/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval }),
    });
    const body = await res.json();
    if (body.url) {
      window.location.href = body.url;
    } else {
      setLoading(null);
      alert(body.error ?? 'Something went wrong.');
    }
  }

  async function openPortal() {
    setLoading('portal');
    const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
    const body = await res.json();
    if (body.url) {
      window.location.href = body.url;
    } else {
      setLoading(null);
      alert(body.error ?? 'Something went wrong.');
    }
  }

  const isActive = subscriptionStatus === 'active';

  if (isActive) {
    return (
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Zap size={16} color="var(--green)" />
          <h3 style={{ margin: 0 }}>Facility Subscription — Active</h3>
        </div>
        <p style={{ margin: '4px 0 12px', fontSize: 14, color: 'var(--ink-soft)' }}>
          {seatCount} pro seat{seatCount !== 1 ? 's' : ''} — all linked pros book at 0% platform fee.
          {rosterCount !== seatCount && (
            <> Your roster has {rosterCount} active pros. Update your seat count in billing.</>
          )}
        </p>
        {hasStripeCustomer && (
          <button
            className="button"
            style={{ fontSize: 13 }}
            onClick={openPortal}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? <Loader2 size={13} className="slots-spinner" /> : null}
            Manage billing &amp; seats
          </button>
        )}
      </div>
    );
  }

  // Not subscribed — show upgrade
  const monthlyTotal = rosterCount * 50;
  const annualTotal = rosterCount * 540;

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Zap size={16} color="var(--ink-soft)" />
        <h3 style={{ margin: 0 }}>Facility Subscription</h3>
      </div>
      <p style={{ margin: '4px 0 12px', fontSize: 14, color: 'var(--ink-soft)' }}>
        Subscribe and your {rosterCount} pro{rosterCount !== 1 ? 's' : ''} book at 0% platform fee — ${monthlyTotal}/month or ${annualTotal}/year for your current roster.
        Seats adjust automatically as you add or remove pros.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="button button-primary"
          style={{ fontSize: 13 }}
          onClick={() => startCheckout('month')}
          disabled={!!loading}
        >
          {loading === 'month' ? <Loader2 size={13} className="slots-spinner" /> : null}
          ${monthlyTotal} / month ({rosterCount} seat{rosterCount !== 1 ? 's' : ''})
        </button>
        <button
          className="button button-primary"
          style={{ fontSize: 13 }}
          onClick={() => startCheckout('year')}
          disabled={!!loading}
        >
          {loading === 'year' ? <Loader2 size={13} className="slots-spinner" /> : null}
          ${annualTotal} / year <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 4 }}>save ~10%</span>
        </button>
      </div>
    </div>
  );
}

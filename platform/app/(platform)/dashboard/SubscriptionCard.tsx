'use client';

import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';

type Props = {
  billingModel: 'take_rate' | 'solo_subscription' | 'facility_subscription';
  hasStripeCustomer: boolean;
};

export function SubscriptionCard({ billingModel, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(interval: 'month' | 'year') {
    setLoading(interval);
    const res = await fetch('/api/subscriptions/solo/checkout', {
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

  if (billingModel === 'facility_subscription') {
    return (
      <div className="dashboard-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Zap size={16} color="var(--green)" />
          <h3 style={{ margin: 0 }}>Billing</h3>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>
          Your facility subscription covers your platform fees — you keep 100% of every booking.
        </p>
      </div>
    );
  }

  if (billingModel === 'solo_subscription') {
    return (
      <div className="dashboard-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Zap size={16} color="var(--green)" />
          <h3 style={{ margin: 0 }}>Billing — Solo Subscription</h3>
        </div>
        <p style={{ margin: '4px 0 12px', fontSize: 14, color: 'var(--ink-soft)' }}>
          You&rsquo;re on a subscription plan — 0% platform fee on all bookings.
        </p>
        {hasStripeCustomer && (
          <button
            className="button"
            style={{ fontSize: 13 }}
            onClick={openPortal}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? <Loader2 size={13} className="slots-spinner" /> : null}
            Manage billing
          </button>
        )}
      </div>
    );
  }

  // take_rate — show upgrade options
  return (
    <div className="dashboard-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Zap size={16} color="var(--ink-soft)" />
        <h3 style={{ margin: 0 }}>Billing — Commission plan</h3>
      </div>
      <p style={{ margin: '4px 0 12px', fontSize: 14, color: 'var(--ink-soft)' }}>
        You&rsquo;re on the free tier — SessionPro takes 10% of each booking. Switch to a flat monthly or annual subscription and keep 100%.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="button button-primary"
          style={{ fontSize: 13 }}
          onClick={() => startCheckout('month')}
          disabled={!!loading}
        >
          {loading === 'month' ? <Loader2 size={13} className="slots-spinner" /> : null}
          $69 / month
        </button>
        <button
          className="button button-primary"
          style={{ fontSize: 13 }}
          onClick={() => startCheckout('year')}
          disabled={!!loading}
        >
          {loading === 'year' ? <Loader2 size={13} className="slots-spinner" /> : null}
          $745 / year <span style={{ fontSize: 11, opacity: 0.8, marginLeft: 4 }}>save ~10%</span>
        </button>
      </div>
    </div>
  );
}

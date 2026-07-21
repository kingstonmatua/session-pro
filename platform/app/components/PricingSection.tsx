import Link from 'next/link';

function CheckIcon({ color = '#059669' }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill={color === 'green' ? '#D1FAE5' : '#F3F4F6'} />
      <path d="M4.5 8l2.5 2.5 4.5-5" stroke={color === 'green' ? '#059669' : '#6B7280'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const soloFeatures = [
  'Public booking page at sessionpro.io/yourname',
  'Single sessions and multi-session packages',
  'Instant or request-based booking',
  'Online payments via Stripe',
  'Availability and scheduling controls',
  'Automated client reminders',
  'Reviews and ratings',
];

const facilityFeatures = [
  'Shared booking page at sessionpro.io/clubs/yourclub',
  'Multi-pro roster with individual booking flows',
  'Centralized billing — one subscription for all pros',
  '0% platform fee on every booking across your roster',
  'Roster management — add or remove pros any time',
  'Seats adjust automatically as your roster changes',
];

export function PricingSection() {
  return (
    <section className="pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="container">
        <div className="section-header">
          <div className="pill">Pricing</div>
          <h2 id="pricing-heading">Simple, honest pricing.</h2>
          <p>Start free and keep 90% of every booking — or subscribe and keep 100%.</p>
        </div>

        {/* Individual pros */}
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-soft)', marginBottom: 20 }}>
          For individual pros
        </p>

        <div className="pricing__tiers">
          {/* Commission */}
          <div className="pricing__tier">
            <div className="pricing__tier-name">Commission</div>
            <div className="pricing__tier-price">$0<sub> / month</sub></div>
            <div className="pricing__tier-alt">10% platform fee per booking</div>
            <hr className="pricing__tier-rule" />
            <p className="pricing__tier-desc">Free to join. We earn a 10% fee only when a session is booked — no subscription required.</p>
            <ul className="pricing__tier-features">
              {soloFeatures.map((f) => (
                <li key={f}><CheckIcon color="gray" />{f}</li>
              ))}
              <li style={{ color: 'var(--ink-soft)', fontSize: 13 }}>10% fee deducted at checkout</li>
            </ul>
            <Link href="/auth/signup" className="btn-ghost" style={{ textAlign: 'center', marginTop: 8 }}>
              Claim your free page
            </Link>
          </div>

          {/* Solo Subscription */}
          <div className="pricing__tier pricing__tier--featured">
            <div className="pricing__tier-badge">Most popular</div>
            <div className="pricing__tier-name">Solo Subscription</div>
            <div className="pricing__tier-price">$69<sub> / month</sub></div>
            <div className="pricing__tier-alt">or $745 / year &mdash; save ~10%</div>
            <hr className="pricing__tier-rule" />
            <p className="pricing__tier-desc">Flat monthly or annual fee. Zero platform fee on every booking &mdash; you keep 100%.</p>
            <ul className="pricing__tier-features">
              {soloFeatures.map((f) => (
                <li key={f}><CheckIcon color="green" />{f}</li>
              ))}
              <li><CheckIcon color="green" /><strong>0% platform fee — keep every dollar</strong></li>
            </ul>
            <Link href="/auth/signup" className="btn-primary" style={{ textAlign: 'center', marginTop: 8 }}>
              Get started &rarr;
            </Link>
          </div>
        </div>

        {/* Facility */}
        <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-soft)', margin: '40px 0 20px' }}>
          For facilities &amp; clubs
        </p>

        <div className="pricing__facility">
          <div className="pricing__facility-left">
            <div className="pricing__facility-name">Facility Subscription</div>
            <div className="pricing__facility-price">$50<sub> / pro seat / mo</sub></div>
            <div className="pricing__facility-alt">or $540 / seat / year &mdash; save ~10%</div>
            <p className="pricing__facility-desc">
              One subscription covers your entire roster. Every pro linked to your facility books at 0% platform fee.
              Seats adjust automatically as you add or remove pros &mdash; no renegotiating, no per-head contracts.
            </p>
            <Link href="/auth/signup" className="btn-primary" style={{ marginTop: 8, display: 'inline-block' }}>
              Set up your facility &rarr;
            </Link>
          </div>

          <div className="pricing__divider" aria-hidden="true" style={{ alignSelf: 'stretch', height: 'auto' }} />

          <ul className="pricing__tier-features" style={{ alignSelf: 'center' }}>
            {facilityFeatures.map((f) => (
              <li key={f}><CheckIcon color="green" />{f}</li>
            ))}
          </ul>
        </div>

        <p className="pricing__note">
          Facility pricing example: 4 pros &times; $50 = $200 / month, or $2,160 / year.
          Add a pro, your next invoice reflects the extra seat automatically.
        </p>
      </div>
    </section>
  );
}

import { ConnectStripeButton } from '../../ConnectStripeButton';

export default function ConnectRefreshPage() {
  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card">
          <h1>Link expired</h1>
          <p>Your Stripe setup link expired before you finished. Click below to get a new one.</p>
          <ConnectStripeButton label="Restart Stripe setup" />
        </div>
      </section>
    </main>
  );
}

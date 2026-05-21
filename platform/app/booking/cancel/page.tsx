import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function BookingCancelPage() {
  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card">
          <XCircle size={48} className="booking-status-icon booking-status-icon--cancel" />
          <h1>Payment cancelled</h1>
          <p>No charge was made. Your time slot has been released — head back to try again.</p>
          <Link href="javascript:history.back()" className="button button-primary">
            Go back
          </Link>
        </div>
      </section>
    </main>
  );
}

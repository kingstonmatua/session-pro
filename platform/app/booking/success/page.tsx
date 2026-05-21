import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{ proSlug?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { proSlug } = await searchParams;

  return (
    <main>
      <section className="booking-status-page">
        <div className="booking-status-card">
          <CheckCircle2 size={48} className="booking-status-icon booking-status-icon--success" />
          <h1>You&rsquo;re booked!</h1>
          <p>Your session is confirmed. Check your email for a confirmation and any details from your instructor.</p>
          {proSlug ? (
            <Link href={`/${proSlug}`} className="button button-primary">
              Back to profile
            </Link>
          ) : (
            <Link href="/" className="button button-primary">
              Back to home
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

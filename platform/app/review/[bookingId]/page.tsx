import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewForm } from './ReviewForm';

type PageProps = {
  params: Promise<{ bookingId: string }>;
};

export default async function ReviewPage({ params }: PageProps) {
  const { bookingId } = await params;

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, status, starts_at,
      pros ( full_name, slug, profile_photo_path, discipline ),
      services ( name ),
      clients ( full_name )
    `)
    .eq('id', bookingId)
    .eq('status', 'confirmed')
    .single();

  if (!booking) notFound();

  const { count: alreadyReviewed } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', bookingId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pro = booking.pros as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = booking.services as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = booking.clients as any;

  const photoSrc = pro?.profile_photo_path
    ? pro.profile_photo_path.startsWith('/')
      ? pro.profile_photo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${pro.profile_photo_path}`
    : null;

  const sessionDate = new Date(booking.starts_at).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo" priority />
          </Link>
        </div>
      </header>

      <main>
        <section className="review-page">
          <div className="review-card-wrap">
            <div className="review-pro-header">
              {photoSrc ? (
                <Image
                  src={photoSrc}
                  alt={pro.full_name}
                  width={64}
                  height={64}
                  className="review-pro-avatar"
                />
              ) : (
                <div className="review-pro-avatar review-pro-avatar--initials">
                  {pro.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="review-pro-discipline">{pro.discipline}</p>
                <h1 className="review-pro-name">{pro.full_name}</h1>
                <p className="review-session-meta">{service?.name} &middot; {sessionDate}</p>
              </div>
            </div>

            {(alreadyReviewed ?? 0) > 0 ? (
              <div className="review-already-done">
                <p>You&rsquo;ve already submitted a review for this session. Thank you!</p>
                <Link href={`/${pro.slug}`} className="button button-primary">
                  Back to profile
                </Link>
              </div>
            ) : (
              <>
                <h2 className="review-form-heading">How was your session?</h2>
                <ReviewForm
                  bookingId={bookingId}
                  proName={pro.full_name}
                  defaultName={client?.full_name ?? ''}
                  proSlug={pro.slug}
                />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

import { CheckCircle2, Clock, MapPin, Star, Quote } from "lucide-react";
import { BookingFlow } from "./BookingFlow";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { centsToDollars, getProPageData, DEMO_PRO_ID } from "@/lib/profiles";
import type { AvailabilityRule } from "@/types/sessionpro";

const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const DAY_SHORT: Record<string, string> = { mon:'Mon', tue:'Tue', wed:'Wed', thu:'Thu', fri:'Fri', sat:'Sat', sun:'Sun' };

function formatAvailDays(availability: AvailabilityRule[]): string | null {
  if (!availability.length) return null;
  const days = [...new Set(availability.map(r => r.day))].sort(
    (a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)
  );
  const s = new Set(days);
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && ['mon','tue','wed','thu','fri'].every(d => s.has(d as AvailabilityRule['day']))) return 'Weekdays';
  if (days.length === 6 && ['mon','tue','wed','thu','fri','sat'].every(d => s.has(d as AvailabilityRule['day']))) return 'Mon – Sat';
  return days.map(d => DAY_SHORT[d]).join(', ');
}

const SESSION_MODE_LABEL: Record<string, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'In person & online',
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getProPageData(slug);

  if (!data) {
    notFound();
  }

  const { pro, services, availability, reviews } = data;
  const demoPaymentLink = pro.id === DEMO_PRO_ID
    ? process.env.NEXT_PUBLIC_STRIPE_DEMO_PAYMENT_LINK
    : undefined;
  const singles = services.filter((service) => service.kind === "single");
  const startingPrice = singles.length
    ? Math.min(...singles.map((service) => service.price_cents))
    : 0;
  const sessionDuration = singles[0]?.duration_minutes ?? null;
  const sessionModeLabel = SESSION_MODE_LABEL[pro.session_mode] ?? 'In person';
  const availDays = formatAvailDays(availability);
  const photoSrc = pro.profile_photo_path
    ? pro.profile_photo_path.startsWith("/")
      ? pro.profile_photo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${pro.profile_photo_path}`
    : null;
  const initials = pro.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo" priority />
          </Link>
          <Link href="/auth/signup" className="button button-primary" style={{ fontSize: 14 }}>
            Claim your page
          </Link>
        </div>
      </header>
      <main>
      <section className="pro-hero">
        <div className="container pro-hero-grid">
          <div>
            <div className="photo-shell">
              {photoSrc ? (
                <Image className="profile-photo" src={photoSrc} alt={`${pro.full_name} profile photo`} width={900} height={675} priority />
              ) : (
                <div className="photo-initials">{initials}</div>
              )}
            </div>
            <div className="quick-meta">
              <span><MapPin size={15} />{pro.location_city}, {pro.location_region}</span>
              {sessionDuration && <span><Clock size={15} />{sessionDuration} minutes</span>}
              <span><CheckCircle2 size={15} />{sessionModeLabel}</span>
            </div>
          </div>

          <div className="pro-hero-copy">
            <div className="profile-title">
              <div>
                <div className="eyebrow">{pro.discipline}</div>
                <h1>{pro.full_name}</h1>
                <p className="muted">
                  {pro.title}
                  {pro.club_or_business ? ` at ${pro.club_or_business}` : ""}
                </p>
              </div>
              {pro.rating_average ? (
                <div className="rating-badge" aria-label={`${pro.rating_average} star rating`}>
                  <Star size={16} fill="#D97706" color="#D97706" />
                  {pro.rating_average.toFixed(1)}
                </div>
              ) : null}
            </div>

            <p className="bio">{pro.bio}</p>

            <div className="hero-stats">
              {pro.years_experience && (
                <div>
                  <strong>{pro.years_experience} years</strong>
                  <span>Experience</span>
                </div>
              )}
              {startingPrice > 0 && (
                <div>
                  <strong>{centsToDollars(startingPrice)}+</strong>
                  <span>Starting price</span>
                </div>
              )}
              {availDays && (
                <div>
                  <strong>{availDays}</strong>
                  <span>Availability</span>
                </div>
              )}
            </div>

            <a className="button button-primary hero-book-button" href="#booking">
              Book a session
            </a>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="profile-reviews">
          <div className="container">
            <div className="profile-reviews-header">
              <h2>What clients say</h2>
              {pro.rating_average && (
                <div className="profile-reviews-summary">
                  <div className="profile-reviews-stars">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={18} fill={n <= Math.round(pro.rating_average!) ? '#D97706' : 'none'} color="#D97706" />
                    ))}
                  </div>
                  <span>{Number(pro.rating_average).toFixed(1)} · {pro.rating_count} {pro.rating_count === 1 ? 'review' : 'reviews'}</span>
                </div>
              )}
            </div>
            <div className="reviews-grid">
              {reviews.map(review => (
                <div key={review.id} className="review-card">
                  <Quote size={20} className="review-card-quote-icon" />
                  <div className="review-card-stars">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={13} fill={n <= review.rating ? '#D97706' : 'none'} color="#D97706" />
                    ))}
                  </div>
                  {review.quote && <p className="review-card-text">{review.quote}</p>}
                  <p className="review-card-author">{review.reviewer_name ?? 'Anonymous'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="profile-content" id="booking">
        <BookingFlow pro={pro} services={services} availability={availability} demoPaymentLink={demoPaymentLink} />
      </section>
    </main>
    </div>
  );
}

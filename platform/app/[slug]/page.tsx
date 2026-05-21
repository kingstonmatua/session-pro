import { CheckCircle2, Clock, MapPin, Star } from "lucide-react";
import { BookingFlow } from "./BookingFlow";
import Image from "next/image";
import { notFound } from "next/navigation";
import { centsToDollars, getProPageData } from "@/lib/profiles";

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

  const { pro, services, availability } = data;
  const singles = services.filter((service) => service.kind === "single");
  const startingPrice = singles.length
    ? Math.min(...singles.map((service) => service.price_cents))
    : 0;
  const photoSrc = pro.profile_photo_path
    ? pro.profile_photo_path.startsWith("/")
      ? pro.profile_photo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${pro.profile_photo_path}`
    : null;
  const initials = pro.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
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
              <span><Clock size={15} />60 minutes</span>
              <span><CheckCircle2 size={15} />In person only</span>
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
              <div>
                <strong>{pro.years_experience ?? 5} years</strong>
                <span>Experience</span>
              </div>
              <div>
                <strong>{startingPrice ? centsToDollars(startingPrice) : "$80"}+</strong>
                <span>Starting price</span>
              </div>
              <div>
                <strong>Weekdays</strong>
                <span>Availability</span>
              </div>
            </div>

            <a className="button button-primary hero-book-button" href="#booking">
              Book a session
            </a>
          </div>
        </div>
      </section>

      <section className="profile-content" id="booking">
        <BookingFlow pro={pro} services={services} availability={availability} />
      </section>
    </main>
  );
}

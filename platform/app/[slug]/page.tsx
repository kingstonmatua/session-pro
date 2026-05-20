import { CalendarDays, CheckCircle2, Clock, CreditCard, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { centsToDollars, formatAvailability, getProPageData } from "@/lib/profiles";

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
  const packages = services.filter((service) => service.kind === "package");
  const startingPrice = singles.length
    ? Math.min(...singles.map((service) => service.price_cents))
    : 0;
  const photoSrc = pro.profile_photo_path?.startsWith("/")
    ? pro.profile_photo_path
    : "/images/kenyon-matua-golf.jpeg";

  return (
    <main>
      <section className="pro-hero">
        <div className="container pro-hero-grid">
          <div>
            <div className="photo-shell">
              <Image className="profile-photo" src={photoSrc} alt={`${pro.full_name} profile photo`} width={900} height={675} priority />
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
          </div>
        </div>
      </section>

      <section className="profile-content">
        <div className="container booking-grid">
          <div>
            <section className="panel">
              <div className="section-heading">
                <span>01</span>
                <div>
                  <h2>Choose a session</h2>
                  <p>Select a single lesson or package. Booking flow is the next build slice.</p>
                </div>
              </div>
              <div className="service-grid">
                {singles.map((service) => (
                  <article className="service-card" key={service.id}>
                    <div className="service-topline">
                      <div>
                        <div className="service-name">{service.name}</div>
                        <div className="service-detail">{service.duration_minutes} minutes · {service.level}</div>
                      </div>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="price">{centsToDollars(service.price_cents)}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="section panel">
              <div className="section-heading">
                <span>02</span>
                <div>
                  <h2>Packages</h2>
                  <p>Prepaid sessions for clients ready to build consistency.</p>
                </div>
              </div>
              <div className="service-grid">
                {packages.map((service) => {
                  const savings = service.compare_at_price_cents
                    ? service.compare_at_price_cents - service.price_cents
                    : 0;

                  return (
                    <article className="service-card package" key={service.id}>
                      <div className="service-topline">
                        <div>
                          <div className="service-name">
                            {service.name} {service.level ? `(${service.level})` : ""}
                          </div>
                          <div className="service-detail">{service.session_count} sessions · {centsToDollars(Math.round(service.price_cents / service.session_count))}/session</div>
                        </div>
                        {savings > 0 ? <span className="savings">Save {centsToDollars(savings)}</span> : null}
                      </div>
                      <div className="price">{centsToDollars(service.price_cents)}</div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="booking-panel">
            <div className="booking-panel-header">
              <div>
                <span>Booking preview</span>
                <h2>Reserve a lesson</h2>
              </div>
              <CreditCard size={22} />
            </div>

            <div className="summary-row">
              <span>Instructor</span>
              <strong>{pro.full_name}</strong>
            </div>
            <div className="summary-row">
              <span>Location</span>
              <strong>{pro.club_or_business}</strong>
            </div>
            <div className="summary-row">
              <span>Starting at</span>
              <strong>{startingPrice ? centsToDollars(startingPrice) : "$80"}</strong>
            </div>

            <div className="availability-card">
              <div className="availability-title">
                <CalendarDays size={18} />
                Available weekly
              </div>
              <ul className="availability-list">
                {availability.map((rule) => (
                  <li key={rule.id}>
                    <span>{formatAvailability(rule).split(" ")[0]}</span>
                    <strong>{formatAvailability(rule).split(" ").slice(1).join(" ")}</strong>
                  </li>
                ))}
              </ul>
            </div>

            <button className="button button-primary booking-button" type="button">
              Booking engine coming next
            </button>
            <p className="fine-print">The next platform slice will turn this preview into real date, time, and payment selection.</p>
          </aside>
        </div>
      </section>
    </main>
  );
}

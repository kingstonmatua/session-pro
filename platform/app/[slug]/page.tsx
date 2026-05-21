import { CalendarDays, CheckCircle2, Clock, MapPin, Star } from "lucide-react";
import { BookingCalendar } from "./BookingCalendar";
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
  const photoSrc = pro.profile_photo_path
    ? pro.profile_photo_path.startsWith("/")
      ? pro.profile_photo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${pro.profile_photo_path}`
    : null;
  const initials = pro.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const primaryService = singles[0];

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
        <div className="container booking-grid">
          <div>
            <section className="panel">
              <div className="section-heading">
                <span>01</span>
                <div>
                  <h2>Choose a session</h2>
                  <p>Select the lesson that fits your game. Packages are available for clients who want consistent progress.</p>
                </div>
              </div>
              <div className="service-grid">
                {singles.map((service, index) => (
                  <article className={`service-card ${index === 0 ? "selected" : ""}`} key={service.id}>
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
                  <p>Save when you book multiple lessons up front.</p>
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

            <section className="section panel">
              <div className="section-heading">
                <span>03</span>
                <div>
                  <h2>Select a date and time</h2>
                  <p>Weekday lesson availability at Alpine Country Club.</p>
                </div>
              </div>

              <BookingCalendar />
            </section>
          </div>

          <aside className="booking-panel">
            <div className="booking-panel-header">
              <div>
                <span>Booking summary</span>
                <h2>Reserve your lesson</h2>
              </div>
              <CalendarDays size={22} />
            </div>

            <div className="summary-row">
              <span>Instructor</span>
              <strong>{pro.full_name}</strong>
            </div>
            <div className="summary-row">
              <span>Session</span>
              <strong>{primaryService?.name ?? "Beginner lesson"}</strong>
            </div>
            <div className="summary-row">
              <span>Date</span>
              <strong>Friday, May 22</strong>
            </div>
            <div className="summary-row">
              <span>Time</span>
              <strong>10:30 AM</strong>
            </div>
            <div className="summary-row">
              <span>Location</span>
              <strong>{pro.club_or_business}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{primaryService ? centsToDollars(primaryService.price_cents) : "$80"}</strong>
            </div>

            <button className="button button-primary booking-button" type="button">
              Proceed to payment
            </button>
            <p className="fine-print">Secure payment via Stripe. Free cancellation 24 hours before session.</p>

            <div className="availability-card">
              <div className="availability-title">
                <CalendarDays size={18} />
                Weekly availability
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
          </aside>
        </div>
      </section>
    </main>
  );
}

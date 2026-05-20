import { CalendarDays, Clock, MapPin, Star } from "lucide-react";
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
  const photoSrc = pro.profile_photo_path?.startsWith("/")
    ? pro.profile_photo_path
    : "/images/kenyon-matua-golf.jpeg";

  return (
    <main className="profile">
      <div className="container profile-grid">
        <aside>
          <Image className="profile-photo" src={photoSrc} alt={`${pro.full_name} profile photo`} width={720} height={540} priority />
          <section className="section panel">
            <h2>Availability</h2>
            <ul className="availability-list">
              {availability.map((rule) => (
                <li key={rule.id}>
                  <span>{formatAvailability(rule).split(" ")[0]}</span>
                  <strong>{formatAvailability(rule).split(" ").slice(1).join(" ")}</strong>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div>
          <section className="panel">
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
                <div className="meta-pill" aria-label={`${pro.rating_average} star rating`}>
                  <Star size={16} fill="#D97706" color="#D97706" />
                  {pro.rating_average.toFixed(1)}
                </div>
              ) : null}
            </div>

            <p className="bio">{pro.bio}</p>

            <div className="meta-list">
              <span className="meta-pill">
                <MapPin size={16} />
                {pro.location_city}, {pro.location_region}
              </span>
              <span className="meta-pill">
                <Clock size={16} />
                60 minute sessions
              </span>
              <span className="meta-pill">
                <CalendarDays size={16} />
                In person only
              </span>
            </div>
          </section>

          <section className="section panel">
            <h2>Single sessions</h2>
            <div className="service-grid">
              {singles.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-name">{service.name}</div>
                  <div className="service-detail">{service.duration_minutes} minutes</div>
                  <div className="price">{centsToDollars(service.price_cents)}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="section panel">
            <h2>Packages</h2>
            <div className="service-grid">
              {packages.map((service) => {
                const savings = service.compare_at_price_cents
                  ? service.compare_at_price_cents - service.price_cents
                  : 0;

                return (
                  <article className="service-card package" key={service.id}>
                    <div className="service-name">
                      {service.name} {service.level ? `(${service.level})` : ""}
                    </div>
                    <div className="service-detail">{service.session_count} sessions</div>
                    <div className="price">{centsToDollars(service.price_cents)}</div>
                    {savings > 0 ? <span className="savings">Save {centsToDollars(savings)}</span> : null}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

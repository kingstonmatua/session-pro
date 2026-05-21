import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">For coaches &amp; instructors</div>
            <h1>Your expertise deserves a better front door.</h1>
            <p className="hero-copy">
              SessionPro gives you a professional booking page in minutes. Set your availability, services, and pricing — your clients handle the rest.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/auth/signup">Claim your page</Link>
              <Link className="button" href="/kenyonmatua">View demo</Link>
              <Link className="button" href="/auth/login">Log in</Link>
            </div>
          </div>

          <aside className="demo-card">
            <h2>Everything you need</h2>
            <ul className="feature-list">
              <li>A public booking page with your name and brand</li>
              <li>Single sessions and multi-session packages</li>
              <li>Clients book and pay online — no back-and-forth</li>
              <li>Full control over your availability and pricing</li>
              <li>Live in minutes, no design skills needed</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}

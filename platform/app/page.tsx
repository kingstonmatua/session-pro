import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Platform foundation</div>
            <h1>Your expertise deserves a better front door.</h1>
            <p className="hero-copy">
              This is the first dynamic SessionPro app shell. The static landing page is still safe, while this app becomes
              the foundation for pro signup, dynamic booking pages, and Supabase-backed availability.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/kenyonmatua">View Kenyon demo</Link>
              <a className="button" href="https://sessionpro.io">Current live site</a>
            </div>
          </div>
          <aside className="demo-card">
            <h2>Next build targets</h2>
            <p>Connect Supabase environment keys, replace fallback demo data, then build pro authentication and onboarding.</p>
            <div className="setup-warning">
              Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` to read from your Supabase project.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

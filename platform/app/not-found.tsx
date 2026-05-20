import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="container panel">
        <div className="eyebrow">Profile not found</div>
        <h1>This SessionPro page is not available yet.</h1>
        <p className="hero-copy">Check the link or return to the platform home page.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/">Back home</Link>
        </div>
      </div>
    </main>
  );
}

import Image from 'next/image';
import Link from 'next/link';

export function SiteFooter() {
  return (
    <div className="landing-page">
      <footer className="footer" aria-label="Site footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <Image
                src="/images/logo-nav.png"
                alt="SessionPro"
                width={911}
                height={270}
                className="footer-logo"
              />
            </div>
            <nav className="footer__links" aria-label="Footer navigation">
              <Link href="/for-pros">For Pros</Link>
              <a href="mailto:hello@sessionpro.io">Contact</a>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </nav>
            <span className="footer__copy">&copy; 2026 SessionPro &middot; sessionpro.io</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

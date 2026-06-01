import Image from 'next/image';
import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-page">

      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav__inner">
          <Link href="/" className="nav__brand" aria-label="SessionPro home">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo nav-logo--desktop" priority />
            <Image src="/images/logo-mobile.png" alt="SessionPro" width={1080} height={1080} className="nav-logo nav-logo--mobile" priority />
          </Link>
          <div className="nav__right">
            <Link href="/for-pros">For Pros</Link>
            <Link href="/auth/signup" className="btn-primary">Claim Your Page</Link>
            <Link href="/auth/login">Pro Log In</Link>
          </div>
        </div>
      </nav>

      {children}

      <footer className="footer" aria-label="Site footer">
        <div className="container">
          <div className="footer__inner">
            <div className="footer__brand">
              <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="footer-logo" />
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

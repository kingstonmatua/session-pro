import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PricingSection } from '@/app/components/PricingSection';
import { SiteFooter } from '@/app/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Pricing — SessionPro',
  description: 'Free to start with a 10% booking fee, or subscribe for $69/month and keep 100% of every booking. Facility plans available from $50/pro seat/month.',
  alternates: { canonical: 'https://sessionpro.io/pricing' },
  openGraph: {
    title: 'Pricing — SessionPro',
    description: 'Free to start or subscribe and keep 100%. Facility plans for clubs and training facilities.',
    url: 'https://sessionpro.io/pricing',
    siteName: 'SessionPro',
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <div className="landing-page">
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="nav__inner">
          <Link href="/for-pros" className="nav__brand" aria-label="SessionPro home">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo nav-logo--desktop" priority />
            <Image src="/images/logo-mobile.png" alt="SessionPro" width={1080} height={1080} className="nav-logo nav-logo--mobile" priority />
          </Link>
          <div className="nav__right">
            <Link href="/for-pros">For pros</Link>
            <Link href="/auth/signup" className="btn-primary">Claim Your Page</Link>
            <Link href="/auth/login">Log In</Link>
          </div>
        </div>
      </nav>

      <div style={{ paddingTop: 32 }}>
        <PricingSection />
      </div>

      <SiteFooter />
    </div>
  );
}

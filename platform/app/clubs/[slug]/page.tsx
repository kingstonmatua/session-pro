import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getClubPageData, DEMO_CLUB_ID } from "@/lib/profiles";
import { SiteFooter } from "@/app/components/SiteFooter";
import { ClubBookingSelector } from "./ClubBookingSelector";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getClubPageData(slug);
  if (!data) return { title: 'Club not found | SessionPro' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sessionpro.io';
  const title = `${data.club.name} | SessionPro`;
  const description = data.club.description ?? `Book a private lesson with one of ${data.club.name}'s pros on SessionPro.`;
  const pageUrl = `${appUrl}/clubs/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, siteName: 'SessionPro', type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function ClubPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getClubPageData(slug);

  if (!data) notFound();

  const { club, pros } = data;
  const demoPaymentLink = club.id === DEMO_CLUB_ID
    ? process.env.NEXT_PUBLIC_STRIPE_DEMO_PAYMENT_LINK
    : undefined;
  const logoSrc = club.logo_path
    ? club.logo_path.startsWith('/')
      ? club.logo_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pro-media/${club.logo_path}`
    : null;
  const initials = club.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo" priority />
          </Link>
          <Link href="/auth/signup" className="button button-primary" style={{ fontSize: 14 }}>
            Claim Your Page
          </Link>
        </div>
      </header>
      <main>
        <section className="club-hero">
          <div className="container club-hero-inner">
            <div className="club-logo">
              {logoSrc ? (
                <Image src={logoSrc} alt={`${club.name} logo`} width={88} height={88} />
              ) : (
                <div className="photo-initials" style={{ fontSize: 28 }}>{initials}</div>
              )}
            </div>
            <div>
              <h1>{club.name}</h1>
              {club.description && <p className="muted">{club.description}</p>}
            </div>
          </div>
        </section>

        <section className="profile-content" id="booking">
          <ClubBookingSelector pros={pros} demoPaymentLink={demoPaymentLink} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

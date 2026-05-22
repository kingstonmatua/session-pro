'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopbarNav() {
  const pathname = usePathname();

  const isProfilePage =
    pathname !== '/' &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/onboarding') &&
    !pathname.startsWith('/dashboard');

  if (isProfilePage) return null;

  return (
    <nav className="nav-actions" aria-label="Platform navigation">
      <Link href="/" aria-label="SessionPro home" style={{ display: 'flex', alignItems: 'center' }}>
        <Image src="/images/logo.png" alt="SessionPro" height={30} width={150} style={{ objectFit: 'contain', objectPosition: 'left' }} />
      </Link>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link className="button" href="/marcusreed">View demo</Link>
        <Link className="button" href="/auth/login">Log in</Link>
        <Link className="button button-primary" href="/auth/signup">Claim your page</Link>
      </div>
    </nav>
  );
}

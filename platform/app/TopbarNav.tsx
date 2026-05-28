'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopbarNav() {
  const pathname = usePathname();

  const isProfilePage =
    pathname !== '/' &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/onboarding');

  if (isProfilePage) return null;

  return (
    <nav className="nav-actions" aria-label="Platform navigation">
      <Link className="button" href="/marcusreed">View Demo</Link>
      <Link className="button button-primary" href="/auth/signup">Claim Your Page</Link>
      <Link className="button" href="/auth/login">Pro Log In</Link>
    </nav>
  );
}

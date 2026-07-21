'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/app/(platform)/dashboard/LogoutButton';

const LINKS = [
  { href: '/club-dashboard',          label: 'Overview' },
  { href: '/club-dashboard/roster',   label: 'Roster' },
  { href: '/club-dashboard/bookings', label: 'Bookings' },
  { href: '/club-dashboard/edit',     label: 'Branding' },
];

export function ClubDashboardNav() {
  const path = usePathname();

  return (
    <nav className="admin-nav">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`admin-nav-link${path === href ? ' active' : ''}`}
        >
          {label}
        </Link>
      ))}
      <LogoutButton />
    </nav>
  );
}

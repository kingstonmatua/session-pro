'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin',          label: 'Overview' },
  { href: '/admin/pros',     label: 'Pros' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/reviews',  label: 'Reviews' },
];

export function AdminNav() {
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
    </nav>
  );
}

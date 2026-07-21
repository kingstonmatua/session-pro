'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const LINKS = [
  { href: '/admin',          label: 'Overview' },
  { href: '/admin/pros',     label: 'Pros' },
  { href: '/admin/clubs',    label: 'Clubs' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/reviews',  label: 'Reviews' },
];

export function AdminNav() {
  const path = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

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
      <button className="admin-nav-link" onClick={handleSignOut}>Sign Out</button>
    </nav>
  );
}

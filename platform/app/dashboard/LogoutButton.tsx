'use client';

import { createBrowserClient } from '@supabase/ssr';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <button className="button" onClick={handleLogout} style={{ fontSize: 14, minHeight: 38, padding: '0 14px' }}>
      <LogOut size={15} /> Log out
    </button>
  );
}

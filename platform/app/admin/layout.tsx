import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AdminNav } from './AdminNav';
import './admin.css';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? '')) redirect('/dashboard');

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link href="/admin">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} style={{ height: 32, width: 'auto' }} priority />
          </Link>
          <span className="admin-badge">Admin</span>
          <AdminNav />
        </div>
      </header>
      {children}
    </div>
  );
}

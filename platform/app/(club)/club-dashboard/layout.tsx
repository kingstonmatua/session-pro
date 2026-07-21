import Image from 'next/image';
import Link from 'next/link';
import { ClubDashboardNav } from './ClubDashboardNav';
import '@/app/admin/admin.css';

export default function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link href="/club-dashboard">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} style={{ height: 32, width: 'auto' }} priority />
          </Link>
          <span className="admin-badge">Club</span>
          <ClubDashboardNav />
        </div>
      </header>
      {children}
    </div>
  );
}

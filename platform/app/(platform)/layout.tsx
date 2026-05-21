import Link from "next/link";
import { TopbarNav } from "../TopbarNav";

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="36" cy="36" r="33" stroke="#E5E7EB" strokeWidth="3" />
      <path d="M36 3 A33 33 0 1 1 3 45" stroke="#059669" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="18" y="20" width="36" height="34" rx="7" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
      <rect x="18" y="20" width="36" height="11" rx="7" fill="#059669" />
      <rect x="18" y="27" width="36" height="4" fill="#059669" />
      <rect x="27" y="15" width="3" height="10" rx="1.5" fill="#059669" />
      <rect x="42" y="15" width="3" height="10" rx="1.5" fill="#059669" />
      <path d="M27.5 40.5l5 5 12-13" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <Logo />
            <span>Session<span>Pro</span></span>
          </Link>
          <TopbarNav />
        </div>
      </header>
      {children}
    </div>
  );
}

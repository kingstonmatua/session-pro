import Image from "next/image";
import Link from "next/link";
import { TopbarNav } from "../TopbarNav";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <Image src="/images/logo-nav.png" alt="SessionPro" width={911} height={270} className="nav-logo" priority />
          </Link>
          <TopbarNav />
        </div>
      </header>
      {children}
    </div>
  );
}

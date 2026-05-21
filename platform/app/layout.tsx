import type { Metadata } from "next";
import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TopbarNav } from "./TopbarNav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-jakarta"
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument"
});

export const metadata: Metadata = {
  title: "SessionPro Platform",
  description: "Dynamic booking pages for independent coaches, instructors, and trainers."
};

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

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${instrument.variable}`}>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-inner">
              <Link className="brand" href="/">
                <Logo />
                <span>
                  Session<span>Pro</span>
                </span>
              </Link>
              <TopbarNav />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

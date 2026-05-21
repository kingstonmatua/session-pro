import type { Metadata } from "next";
import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./landing.css";

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
  title: "SessionPro — Your expertise deserves a better front door.",
  description: "SessionPro gives independent coaches, instructors, and trainers a professional booking page. Clients book and pay in under two minutes. Free to join."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${instrument.variable}`}>
        {children}
      </body>
    </html>
  );
}

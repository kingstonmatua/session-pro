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
  title: "SessionPro — Find an instructor",
  description: "Browse coaches, trainers, and instructors near you. Book a session in minutes.",
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

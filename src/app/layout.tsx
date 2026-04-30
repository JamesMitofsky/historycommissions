import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Historians & Reconciliation",
  description:
    "A digital archive of joint historians' commissions and dialogues over history.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Masthead — image + nav + site title in one unit */}
        <header className="relative w-full h-56 overflow-hidden">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            className="object-cover object-right-bottom"
          />
          {/* Gradient: dark at top for nav legibility, dark at bottom for title legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />

          {/* Nav — top of image */}
          <Nav />

          {/* Site title — bottom of image */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-2xl mx-auto px-6 pb-5">
              <p className="text-[0.65rem] font-medium tracking-[0.18em] uppercase text-white/60 mb-1">
                A digital archive
              </p>
              <h1 className="text-3xl font-semibold text-white leading-tight">
                Historians &amp; Reconciliation
              </h1>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}

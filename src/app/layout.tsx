import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { getBlurDataURL } from "@/blog/get-blur-data-url";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "History Commissions",
    template: "%s | History Commissions",
  },
  description:
    "A digital archive of joint historians' commissions and dialogues over history.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    siteName: "History Commissions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const heroBlurDataURL = await getBlurDataURL("/hero.webp");
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Masthead — image + nav + site title in one unit */}
        <header className="relative w-full h-56 overflow-hidden">
          <Image
            src="/hero.webp"
            alt=""
            fill
            priority
            className="object-cover object-right-bottom"
            placeholder={heroBlurDataURL ? "blur" : "empty"}
            blurDataURL={heroBlurDataURL ?? undefined}
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
                History Commissions
              </h1>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}

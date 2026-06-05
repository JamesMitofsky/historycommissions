import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4, DM_Sans, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getBlurDataURL } from "@/blog/get-blur-data-url";
import { getGeneralSettings } from "@/settings";
import "./globals.css";
import { cn } from "@/lib/utils";

const general = getGeneralSettings();

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: general.siteTitle,
    template: `%s | ${general.siteTitle}`,
  },
  description: general.description,
  icons: { icon: "/favicon.ico" },
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/feed.xml", title: general.feeds.postsTitle },
        { url: "/commissions/feed.xml", title: general.feeds.commissionsTitle },
      ],
    },
  },
  openGraph: {
    siteName: general.siteTitle,
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
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, sourceSerif4.variable, playfairDisplay.variable, dmSans.variable, "text-[20px]")}
    >
      <body className="min-h-full flex flex-col font-sans text-base leading-[1.65] antialiased [text-rendering:optimizeLegibility]">
        {/* Masthead — image + nav + site title in one unit */}
        <header className="relative w-full h-56 overflow-hidden" style={{ viewTransitionName: "site-header" }}>
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
          <Nav links={general.nav} />

          {/* Site title — bottom of image */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-2xl mx-auto px-6 pb-5">
              <Link href="/" className="inline-block">
                <p className="text-[0.65rem] font-medium tracking-[0.18em] uppercase text-white/60 mb-1">
                  {general.kicker}
                </p>
                <h1 className="text-3xl font-bold text-white leading-tight font-playfair">
                  {general.siteTitle.split(" ").map((word) => (
                    <span key={word} className="block">
                      {word}
                    </span>
                  ))}
                </h1>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>
        <Footer />
        <Script src="https://identity.netlify.com/v1/netlify-identity-widget.js" strategy="afterInteractive" />
        <Script id="netlify-identity-redirect" strategy="afterInteractive">{`
          if (window.netlifyIdentity) {
            window.netlifyIdentity.on("init", function(user) {
              if (!user) {
                window.netlifyIdentity.on("login", function() {
                  document.location.href = "/admin/";
                });
              }
            });
          }
        `}</Script>
      </body>
    </html>
  );
}

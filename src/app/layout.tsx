import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog",
  description: "A minimalist blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)]">
          <nav className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-7">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--foreground)] hover:opacity-70 transition-opacity"
            >
              Posts
            </Link>
            <Link
              href="/commissions"
              className="text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Commissions
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              About
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

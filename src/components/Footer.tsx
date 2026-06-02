import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-muted-foreground flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <p className="font-playfair text-base font-semibold text-foreground">
            History Commissions
          </p>
          <p>A digital archive of joint historians&rsquo; commissions.</p>
          <p>&copy; {year} Daqing Yang.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 sm:items-end">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/commissions" className="hover:text-foreground transition-colors">
            Bilateral Commissions
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>

        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs uppercase tracking-wider text-muted-foreground/70">Subscribe</p>
          <a
            href="/feed.xml"
            className="hover:text-foreground transition-colors"
            title="RSS feed of latest posts"
          >
            Posts RSS
          </a>
          <a
            href="/commissions/feed.xml"
            className="hover:text-foreground transition-colors"
            title="RSS feed of bilateral commissions"
          >
            Commissions RSS
          </a>
        </div>
      </div>
    </footer>
  );
}

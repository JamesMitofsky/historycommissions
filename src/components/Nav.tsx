"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "News", shortLabel: "News" },
  { href: "/commissions", label: "Bilateral Commissions", shortLabel: "Commissions" },
  { href: "/about", label: "About", shortLabel: "About" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="absolute top-0 left-0 right-0 z-10 bg-black/30 backdrop-blur-sm [text-shadow:0_1px_2px_rgb(0_0_0_/_0.5)]">
      <div className="max-w-2xl mx-auto px-6 h-14 sm:h-16 flex items-center justify-end gap-5 sm:gap-8">
        {links.map(({ href, label, shortLabel }) => (
          <Link
            key={href}
            href={href}
            className={`relative text-base sm:text-base font-semibold tracking-wide transition-colors duration-200 ${isActive(href)
                ? "text-white"
                : "text-white/85 hover:text-white"
              }`}
          >
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
            <span
              className={`absolute -bottom-1 left-0 h-0.5 bg-white transition-all duration-300 ${isActive(href) ? "w-full opacity-100" : "w-0 opacity-0"
                }`}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/commissions", label: "Bilateral Commissions" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="absolute top-0 left-0 right-0">
      <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-end gap-7">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors ${
              isActive(href)
                ? "text-white"
                : "text-white/55 hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

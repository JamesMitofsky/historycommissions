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
      <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-end gap-8">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`relative text-base font-medium transition-colors duration-200 ${
              isActive(href)
                ? "text-white"
                : "text-white/55 hover:text-white"
            }`}
          >
            {label}
            <span
              className={`absolute -bottom-0.5 left-0 h-px bg-white transition-all duration-300 ${
                isActive(href) ? "w-full opacity-100" : "w-0 opacity-0"
              }`}
            />
          </Link>
        ))}
      </div>
    </nav>
  );
}

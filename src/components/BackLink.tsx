"use client";

import Link from "next/link";
import { setNavigatingViaViewTransition } from "@/lib/navigation-state";

interface BackLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

export function BackLink({
  href = "/",
  children = "← All posts",
  className = "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10",
}: BackLinkProps) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-back"]}
      onClick={() => { setNavigatingViaViewTransition(true); }}
      className={className}
    >
      {children}
    </Link>
  );
}

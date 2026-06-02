"use client";

import Link from "next/link";
import { setNavigatingViaViewTransition } from "@/lib/navigation-state";

interface BackLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

const defaultClass =
  "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-2 hover:bg-muted/60 hover:border-foreground/20 transition-colors mb-10";

export function BackLink({
  href = "/",
  children = "← All posts",
  className = defaultClass,
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

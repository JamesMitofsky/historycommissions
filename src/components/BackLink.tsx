"use client";

import Link from "next/link";
import { setNavigatingViaViewTransition } from "@/lib/navigation-state";

export function BackLink() {
  return (
    <Link
      href="/"
      transitionTypes={["nav-back"]}
      onClick={() => { setNavigatingViaViewTransition(true); }}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
    >
      ← All posts
    </Link>
  );
}

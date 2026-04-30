import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--secondary)]">
      {children}
    </span>
  );
}

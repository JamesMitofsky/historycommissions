import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium">
      {children}
    </span>
  );
}

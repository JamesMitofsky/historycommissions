import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Chip({
  children,
  interactive = false,
}: {
  children: ReactNode;
  interactive?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium transition-colors",
        interactive && "group-hover:bg-foreground/10 group-hover:text-foreground"
      )}
    >
      {children}
    </span>
  );
}

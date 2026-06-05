import type { CommissionStatus } from "@/commissions/types";
import { STATUS_DOT, STATUS_LABELS, STATUS_TEXT } from "@/commissions/status";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: CommissionStatus;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", STATUS_TEXT[status], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

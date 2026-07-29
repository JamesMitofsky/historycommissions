<script lang="ts">
  import type { CommissionStatus } from "@/commissions/types";
  import { STATUS_DOT, STATUS_LABELS, STATUS_TEXT } from "@/commissions/status";
  import { cn } from "@/lib/utils";

  interface Props {
    status: CommissionStatus;
    class?: string;
  }

  let { status, class: className }: Props = $props();
</script>

<span
  class={cn(
    "inline-flex items-center gap-1.5 text-xs font-medium",
    STATUS_TEXT[status],
    className,
  )}
>
  <span class={cn("w-1.5 h-1.5 rounded-xs shrink-0", STATUS_DOT[status])}
  ></span>
  {STATUS_LABELS[status]}
</span>

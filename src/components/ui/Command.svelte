<script lang="ts">
  import { Command } from "bits-ui";
  import type { Snippet } from "svelte";
  import { cn } from "@/lib/utils";

  interface Props {
    class?: string;
    /** Set false to keep every item mounted and do the filtering yourself. */
    shouldFilter?: boolean;
    children?: Snippet;
  }

  let { class: className, shouldFilter = true, children }: Props = $props();
</script>

<Command.Root
  data-slot="command"
  {shouldFilter}
  class={cn(
    "flex size-full flex-col overflow-hidden rounded-xs! bg-popover p-1 text-popover-foreground",
    className,
  )}
>
  {@render children?.()}
</Command.Root>

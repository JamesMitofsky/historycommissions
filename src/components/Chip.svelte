<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "@/lib/utils";

  interface Props {
    interactive?: boolean;
    children?: Snippet;
  }

  let { interactive = false, children }: Props = $props();
</script>

<span
  class={cn(
    "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-xs bg-muted text-muted-foreground font-medium transition-colors",
    interactive && "group-hover:bg-foreground/10 group-hover:text-foreground",
  )}
>
  {@render children?.()}
</span>

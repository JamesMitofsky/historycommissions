<script lang="ts">
  import { Command } from "bits-ui";
  import type { Snippet } from "svelte";
  import { cn } from "@/lib/utils";

  interface Props {
    class?: string;
    children?: Snippet;
  }

  let { class: className, children }: Props = $props();
</script>

<Command.List
  data-slot="command-list"
  class={cn(
    "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
    className,
  )}
>
  <Command.Viewport>
    {@render children?.()}
  </Command.Viewport>
</Command.List>

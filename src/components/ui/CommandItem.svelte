<script lang="ts">
  import { Command } from "bits-ui";
  import type { Snippet } from "svelte";
  import { cn } from "@/lib/utils";

  interface Props {
    class?: string;
    /** Stable value used for filtering and ranking. */
    value?: string;
    keywords?: string[];
    disabled?: boolean;
    onSelect?: () => void;
    children?: Snippet;
  }

  let {
    class: className,
    value,
    keywords,
    disabled,
    onSelect,
    children,
  }: Props = $props();
</script>

<!-- Unlike the shadcn/cmdk original there is no auto-appended check icon: it was
     permanently invisible here (nothing set data-checked) and every call site
     renders its own check. -->
<Command.Item
  data-slot="command-item"
  {value}
  {keywords}
  {disabled}
  {onSelect}
  class={cn(
    "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:**:[svg]:text-foreground",
    className,
  )}
>
  {@render children?.()}
</Command.Item>

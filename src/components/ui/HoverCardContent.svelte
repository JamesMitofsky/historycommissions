<script lang="ts">
  import { LinkPreview } from "bits-ui";
  import type { Snippet } from "svelte";
  import { cn } from "@/lib/utils";

  interface Props {
    class?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    children?: Snippet;
  }

  let {
    class: className,
    align = "center",
    side,
    sideOffset = 4,
    children,
  }: Props = $props();
</script>

<LinkPreview.Portal>
  <LinkPreview.Content
    data-slot="hover-card-content"
    {align}
    {side}
    {sideOffset}
    class={cn(
      "z-50 flex w-72 origin-(--bits-floating-transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      className,
    )}
  >
    {@render children?.()}
  </LinkPreview.Content>
</LinkPreview.Portal>

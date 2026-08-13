<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "@/lib/utils";
  import { badgeVariants, type BadgeVariant } from "./badge-variants";

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children?: Snippet;
  }

  let {
    variant = "default",
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<span
  data-slot="badge"
  data-variant={variant}
  class={cn(badgeVariants({ variant }), className)}
  {...rest}
>
  {@render children?.()}
</span>

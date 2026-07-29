<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { cn } from "@/lib/utils";
  import {
    buttonVariants,
    type ButtonSize,
    type ButtonVariant,
  } from "./button-variants";

  interface Props extends HTMLButtonAttributes {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children?: Snippet;
  }

  let {
    variant = "default",
    size = "default",
    class: className,
    children,
    ...rest
  }: Props = $props();
</script>

<button
  data-slot="button"
  data-variant={variant}
  data-size={size}
  class={cn(buttonVariants({ variant, size }), className)}
  {...rest}
>
  {@render children?.()}
</button>

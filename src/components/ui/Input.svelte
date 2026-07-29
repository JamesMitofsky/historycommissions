<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "@/lib/utils";

  interface Props extends Omit<HTMLInputAttributes, "value"> {
    value?: string;
  }

  let { class: className, value = $bindable(""), ...rest }: Props = $props();
</script>

<input
  data-slot="input"
  bind:value
  class={cn(
    "h-9 w-full min-w-0 rounded-xs border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    className,
  )}
  {...rest}
/>

<script lang="ts">
  import { Command } from "bits-ui";
  import Search from "@lucide/svelte/icons/search";
  import { cn } from "@/lib/utils";

  interface Props {
    class?: string;
    placeholder?: string;
    value?: string;
  }

  let { class: className, placeholder, value = $bindable("") }: Props =
    $props();
</script>

<!-- The InputGroup chrome is inlined here: it was the component's only consumer,
     so a separate wrapper would have been indirection for one call site. -->
<div data-slot="command-input-wrapper" class="p-1 pb-0">
  <div
    role="group"
    data-slot="input-group"
    class="group/input-group relative flex h-8 w-full min-w-0 items-center rounded-xs border border-input/30 bg-input/30 transition-[color,box-shadow] outline-none has-[[data-slot=command-input]:focus-visible]:border-ring has-[[data-slot=command-input]:focus-visible]:ring-3 has-[[data-slot=command-input]:focus-visible]:ring-ring/50"
  >
    <div
      data-slot="input-group-addon"
      data-align="inline-start"
      class="order-first flex h-auto cursor-text items-center justify-center gap-2 py-1.5 pl-2 text-sm font-medium text-muted-foreground select-none"
    >
      <Search class="size-4 shrink-0 opacity-50" />
    </div>
    <Command.Input
      data-slot="command-input"
      bind:value
      {placeholder}
      class={cn(
        "w-full bg-transparent pl-1.5 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  </div>
</div>

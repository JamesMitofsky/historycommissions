<script lang="ts">
  import { Command } from "bits-ui";
  import type { Snippet } from "svelte";
  import { cn } from "@/lib/utils";

  interface Props {
    class?: string;
    heading?: string;
    children?: Snippet;
  }

  let { class: className, heading, children }: Props = $props();
</script>

<Command.Group
  data-slot="command-group"
  class={cn("overflow-hidden p-1 text-foreground", className)}
>
  {#if heading}
    <Command.GroupHeading
      class="px-2 py-1.5 text-xs font-medium text-muted-foreground"
    >
      {heading}
    </Command.GroupHeading>
  {/if}
  <Command.GroupItems>
    {@render children?.()}
  </Command.GroupItems>
</Command.Group>

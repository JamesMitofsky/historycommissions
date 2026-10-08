<script lang="ts">
  import type { Snippet } from "svelte";

  // Small uppercase heading that opens each block on the commission detail page.
  let { children }: { children: Snippet } = $props();
</script>

<p
  class="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2"
>
  {@render children()}
</p>

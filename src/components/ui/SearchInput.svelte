<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import Search from "@lucide/svelte/icons/search";
  import Input from "./Input.svelte";

  interface Props extends Omit<HTMLInputAttributes, "value" | "class"> {
    value?: string;
    /** Layout classes for the wrapper — the field's own styling is fixed. */
    class?: string;
  }

  let {
    value = $bindable(""),
    class: className,
    ...rest
  }: Props = $props();
</script>

<!-- The magnifier is laid over the field rather than sitting beside it in a
     flex row, the way ui/CommandInput.svelte arranges its own. That keeps the
     wrapper a plain box whose only job is layout, so a caller can hand it
     `flex-1` or leave it to fill its column, and it leaves Input's border and
     focus ring on the input itself instead of having to reproduce them on a
     group. -->
<div class={["relative", className]}>
  <Search
    aria-hidden="true"
    class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 shrink-0 opacity-50"
  />
  <Input
    type="text"
    bind:value
    class="h-8 pl-8 text-sm rounded-xs"
    {...rest}
  />
</div>

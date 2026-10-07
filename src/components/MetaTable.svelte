<script lang="ts">
  interface Props {
    rows: { label: string; value: string | number | null | undefined }[];
  }

  let { rows }: Props = $props();

  const visible = $derived(
    rows.filter(
      (r) => r.value !== null && r.value !== undefined && r.value !== "",
    ),
  );
</script>

{#if visible.length > 0}
  <table class="text-sm w-full border-collapse">
    <tbody>
      {#each visible as { label, value } (label)}
        <tr class="align-top">
          <!-- w-px plus nowrap collapses the label column to its widest label
               instead of a fixed 7rem, which left short labels like "Founded"
               stranded far from their value. -->
          <td class="pr-5 py-0.5 text-muted-foreground whitespace-nowrap w-px">
            {label}
          </td>
          <td class="py-0.5 text-foreground">{value}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<script lang="ts">
  import { Popover } from "bits-ui";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import { cn } from "@/lib/utils";
  import { buttonVariants } from "./ui/button-variants";
  import { badgeVariants } from "./ui/badge-variants";
  import PopoverContent from "./ui/PopoverContent.svelte";
  import Command from "./ui/Command.svelte";
  import CommandInput from "./ui/CommandInput.svelte";
  import CommandList from "./ui/CommandList.svelte";
  import CommandEmpty from "./ui/CommandEmpty.svelte";
  import CommandGroup from "./ui/CommandGroup.svelte";
  import CommandItem from "./ui/CommandItem.svelte";

  interface Props {
    label: string;
    options: { value: string; display: string }[];
    selected: Set<string>;
    onToggle: (value: string) => void;
    onClear: () => void;
  }

  let { label, options, selected, onToggle, onClear }: Props = $props();

  let open = $state(false);
  const count = $derived(selected.size);
</script>

<Popover.Root bind:open>
  <!-- bits-ui renders its own <button>, so the shadcn button classes go straight
       on the trigger rather than through an asChild slot. -->
  <Popover.Trigger
    class={cn(
      buttonVariants({ variant: "outline", size: "sm" }),
      "gap-1.5 font-normal rounded-xs",
      count > 0 && "border-foreground/50",
    )}
    aria-expanded={open}
  >
    {label}
    {#if count > 0}
      <span
        class={cn(
          badgeVariants({ variant: "secondary" }),
          "h-4 min-w-4 px-1 text-[10px] font-semibold rounded-xs",
        )}
      >
        {count}
      </span>
    {/if}
    <ChevronDown
      class={cn(
        "size-3 opacity-50 transition-transform duration-200",
        open && "rotate-180",
      )}
    />
  </Popover.Trigger>

  <PopoverContent class="w-52 p-0" align="start">
    <Command>
      <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
      <CommandList>
        <CommandEmpty>No matches</CommandEmpty>
        <CommandGroup>
          {#each options as { value, display } (value)}
            <CommandItem {value} onSelect={() => onToggle(value)}>
              <Check
                class={cn(
                  "size-3.5 shrink-0",
                  selected.has(value) ? "opacity-100" : "opacity-0",
                )}
              />
              {display}
            </CommandItem>
          {/each}
        </CommandGroup>
      </CommandList>
      {#if count > 0}
        <div class="border-t px-2 py-1.5">
          <button
            onclick={onClear}
            class="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear {label.toLowerCase()}
          </button>
        </div>
      {/if}
    </Command>
  </PopoverContent>
</Popover.Root>

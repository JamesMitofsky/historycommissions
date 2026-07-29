<script lang="ts">
  import { Spring } from "svelte/motion";
  import { crossfade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { cn } from "@/lib/utils";

  interface Props {
    placeholder?: string;
    class?: string;
    /** Collapsed control width in px */
    collapsedWidth?: number;
    /** Expanded control width in px */
    expandedWidth?: number;
    /** Horizontal offset when expanded (px), aligns detached bubble */
    expandedOffset?: number;
    /** Gaussian blur amount for the gooey SVG filter */
    gooeyBlur?: number;
    value?: string;
    disabled?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    placeholder = "Type to search...",
    class: className,
    collapsedWidth = 155,
    expandedWidth = 375,
    expandedOffset = 50,
    gooeyBlur = 6,
    value = $bindable(""),
    disabled = false,
    onOpenChange,
  }: Props = $props();

  // $props.id() must be a bare top-level initializer, so sanitising for use in
  // an SVG id and a url(#…) reference happens in a second step.
  const uid = $props.id();
  const filterId = `gooey-filter-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  let rootEl = $state<HTMLDivElement | null>(null);
  let inputEl = $state<HTMLInputElement | null>(null);
  let isExpanded = $state(false);
  let availableWidth = $state<number | null>(null);

  /**
   * The React original drove these with motion's spring (stiffness 400,
   * damping 28, mass 1 — damping ratio ~0.7, so a fast move with a touch of
   * overshoot). Svelte's Spring uses its own normalised parameters rather than
   * physical units, so these are re-tuned to that response rather than copied.
   */
  const SPRING = { stiffness: 0.2, damping: 0.62 };

  const effectiveExpandedWidth = $derived(
    availableWidth != null
      ? Math.min(expandedWidth, availableWidth - expandedOffset)
      : expandedWidth,
  );

  // svelte-ignore state_referenced_locally
  // Intentional: this is only the spring's starting position. The $effect below
  // owns the target from the first run onward.
  const rowWidth = new Spring(collapsedWidth, SPRING);
  const rowMarginLeft = new Spring(0, SPRING);
  const bubbleScale = new Spring(0, SPRING);
  const bubbleOpacity = new Spring(0, SPRING);
  const bubbleX = new Spring(0, SPRING);

  $effect(() => {
    rowWidth.target = isExpanded ? effectiveExpandedWidth : collapsedWidth;
    rowMarginLeft.target = isExpanded ? expandedOffset : 0;
    bubbleScale.target = isExpanded ? 1 : 0;
    bubbleOpacity.target = isExpanded ? 1 : 0;
    bubbleX.target = isExpanded ? -10 : 0;
  });

  // Track the parent's width so the expanded control never overflows it.
  $effect(() => {
    const parent = rootEl?.parentElement;
    if (!parent) return;
    const measure = () =>
      (availableWidth = parent.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  });

  // Focus on expand; clear the query on collapse. Guarded on the previous state
  // so the initial render cannot clobber a value passed in by the parent.
  let wasExpanded = false;
  $effect(() => {
    if (isExpanded) {
      inputEl?.focus();
    } else if (wasExpanded) {
      value = "";
    }
    wasExpanded = isExpanded;
  });

  function setExpanded(next: boolean) {
    isExpanded = next;
    onOpenChange?.(next);
  }

  function handleExpand() {
    if (!disabled) setExpanded(true);
  }

  function handleBlur() {
    if (!value) setExpanded(false);
  }

  /**
   * Svelte's equivalent of motion's `layoutId`: the icon is FLIP-morphed between
   * its position inside the pill and its position in the detached bubble, which
   * is what sells the gooey split.
   */
  const [send, receive] = crossfade({ duration: 350, easing: cubicOut });

  const surfaceClass =
    "bg-foreground text-background shadow-sm ring-1 ring-border/60";
</script>

{#snippet searchIcon()}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    class="size-4 shrink-0"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
{/snippet}

<div
  bind:this={rootEl}
  class={cn("relative flex items-center justify-center", className)}
>
  <svg class="absolute hidden h-0 w-0" aria-hidden="true">
    <defs>
      <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation={gooeyBlur} result="blur" />
        <feColorMatrix
          in="blur"
          type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
          result="goo"
        />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>

  <div
    class="relative flex h-10 items-center justify-center"
    style="filter: url(#{filterId})"
  >
    <div
      class="flex h-10 items-center justify-center"
      style="width: {rowWidth.current}px; margin-left: {rowMarginLeft.current}px"
    >
      <button
        type="button"
        {disabled}
        onclick={handleExpand}
        class={cn(
          "flex h-10 w-full cursor-pointer items-center justify-center rounded-full px-4 text-sm font-medium outline-none transition-[color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          surfaceClass,
        )}
      >
        <!-- The slot the icon occupies collapses its own width over the same
             350ms the icon takes to fly to the bubble. Without it the icon was
             yanked out of flow the instant its crossfade ended, and the
             placeholder jumped left. overflow stays visible so the icon is not
             clipped while it travels outside this shrinking box. -->
        <span
          class="flex-none transition-[width,margin-right] duration-[350ms] ease-out {isExpanded
            ? 'w-0 mr-0'
            : 'w-4 mr-2'}"
        >
          {#if !isExpanded}
            <span in:receive={{ key: filterId }} out:send={{ key: filterId }}>
              {@render searchIcon()}
            </span>
          {/if}
        </span>
        <input
          bind:this={inputEl}
          bind:value
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          onblur={handleBlur}
          disabled={disabled || !isExpanded}
          {placeholder}
          class={cn(
            "h-full min-w-0 flex-1 bg-transparent text-sm text-background outline-none",
            isExpanded
              ? "placeholder:text-background/50 dark:placeholder:text-background/45"
              : "pointer-events-none placeholder:text-background/80 dark:placeholder:text-background/70",
          )}
        />
      </button>
    </div>

    <div
      class="absolute top-1/2 left-0 flex size-10 items-center justify-center"
      style="opacity: {bubbleOpacity.current}; transform: translateY(-50%) translateX({bubbleX.current}px) scale({bubbleScale.current})"
    >
      <div
        class={cn(
          "flex size-10 items-center justify-center rounded-full",
          surfaceClass,
        )}
      >
        {#if isExpanded}
          <span in:receive={{ key: filterId }} out:send={{ key: filterId }}>
            {@render searchIcon()}
          </span>
        {/if}
      </div>
    </div>
  </div>
</div>

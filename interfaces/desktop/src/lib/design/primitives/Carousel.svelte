<!--
  @file primitives/Carousel.svelte
  @layer primitives

  Data-driven carousel with keyboard navigation and live region.

  A11y Acceptance: Arrow keys navigate, current slide announced
-->
<script lang="ts" module>
  export interface CarouselItem {
    /** Unique identifier */
    id: string;
    /** Label for screen readers */
    label: string;
    /** Any additional data */
    [key: string]: unknown;
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Carousel items */
    items?: CarouselItem[];
    /** Current active index (bindable) */
    activeIndex?: number;
    /** Loop navigation */
    loop?: boolean;
    /** Aria label for the carousel */
    "aria-label"?: string;
    /** Custom slide renderer */
    slide?: Snippet<[CarouselItem, number, boolean]>;
    /** Previous button slot */
    prevButton?: Snippet<[() => void, boolean]>;
    /** Next button slot */
    nextButton?: Snippet<[() => void, boolean]>;
    /** Dots/indicators slot */
    indicators?: Snippet<[CarouselItem[], number, (i: number) => void]>;
    /** Called when active index changes */
    onIndexChange?: (index: number) => void;
  }

  let {
    items = [],
    activeIndex = $bindable(0),
    loop = true,
    "aria-label": ariaLabel = "Carousel",
    slide: slideSlot,
    prevButton,
    nextButton,
    indicators,
    onIndexChange,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Carousel");

  const canGoPrev = $derived(loop || activeIndex > 0);
  const canGoNext = $derived(loop || activeIndex < items.length - 1);

  function goTo(index: number) {
    if (items.length === 0) return;

    let newIndex = index;
    if (loop) {
      newIndex = ((index % items.length) + items.length) % items.length;
    } else {
      newIndex = Math.max(0, Math.min(index, items.length - 1));
    }

    if (newIndex !== activeIndex) {
      activeIndex = newIndex;
      onIndexChange?.(activeIndex);
    }
  }

  function goPrev() {
    goTo(activeIndex - 1);
  }

  function goNext() {
    goTo(activeIndex + 1);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(items.length - 1);
    }
  }

  // Live region announcement
  const announcement = $derived(
    items[activeIndex]
      ? `Slide ${activeIndex + 1} of ${items.length}: ${items[activeIndex].label}`
      : ""
  );
</script>

<div
  role="group"
  aria-roledescription="carousel"
  aria-label={ariaLabel}
  class={className}
  data-kind="primitive"
  data-name="Carousel"
  data-part="root"
  data-id={id}
  onkeydown={handleKeyDown}
  tabindex="0"
  {...rest}
>
  <!-- Live region for announcements -->
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
    data-part="announcer"
  >
    {announcement}
  </div>

  <!-- Navigation controls -->
  <div data-part="controls">
    {#if prevButton}
      {@render prevButton(goPrev, canGoPrev)}
    {:else}
      <button
        type="button"
        aria-label="Previous slide"
        disabled={!canGoPrev}
        onclick={goPrev}
        data-part="prev-button"
      >
        Previous
      </button>
    {/if}

    {#if nextButton}
      {@render nextButton(goNext, canGoNext)}
    {:else}
      <button
        type="button"
        aria-label="Next slide"
        disabled={!canGoNext}
        onclick={goNext}
        data-part="next-button"
      >
        Next
      </button>
    {/if}
  </div>

  <!-- Slides -->
  <div
    data-part="viewport"
    role="group"
    aria-roledescription="slide"
    aria-label={items[activeIndex]?.label ?? ""}
  >
    {#each items as item, i}
      {#if i === activeIndex}
        <div
          data-part="slide"
          data-active="true"
          aria-hidden="false"
        >
          {#if slideSlot}
            {@render slideSlot(item, i, true)}
          {:else}
            {item.label}
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- Indicators -->
  {#if indicators}
    {@render indicators(items, activeIndex, goTo)}
  {:else if items.length > 1}
    <div data-part="indicators" role="tablist">
      {#each items as item, i}
        <button
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          aria-label={`Go to slide ${i + 1}`}
          onclick={() => goTo(i)}
          data-part="indicator"
          data-active={i === activeIndex || undefined}
        >
          <span class="sr-only">{item.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

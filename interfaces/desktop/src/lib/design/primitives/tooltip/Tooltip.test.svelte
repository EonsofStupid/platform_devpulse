<!--
  @file primitives/tooltip/Tooltip.test.svelte
  @layer primitives

  Test wrapper for Tooltip primitive.
  Provides a complete tooltip setup for testing.
-->
<script lang="ts">
  import * as Tooltip from "./index.js";

  interface Props {
    /** Tooltip open state (bindable) */
    open?: boolean;
    /** Trigger button text */
    triggerText?: string;
    /** Content text */
    contentText?: string;
    /** Open delay (ms) */
    openDelay?: number;
    /** Close delay (ms) */
    closeDelay?: number;
    /** Positioning side */
    side?: "top" | "right" | "bottom" | "left";
    /** Side offset */
    sideOffset?: number;
    /** Positioning align */
    align?: "start" | "center" | "end";
    /** Show arrow */
    showArrow?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** data-id for content */
    "data-id"?: string;
  }

  let {
    open = $bindable(false),
    triggerText = "Hover me",
    contentText = "Tooltip content here.",
    openDelay = 700,
    closeDelay = 300,
    side = "top",
    sideOffset = 4,
    align = "center",
    showArrow = false,
    onOpenChange,
    "data-id": dataId,
  }: Props = $props();
</script>

<Tooltip.Root bind:open {onOpenChange} {openDelay} {closeDelay}>
  <Tooltip.Trigger>
    {triggerText}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content
      {side}
      {sideOffset}
      {align}
      data-id={dataId}
    >
      {contentText}
      {#if showArrow}
        <Tooltip.Arrow />
      {/if}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>

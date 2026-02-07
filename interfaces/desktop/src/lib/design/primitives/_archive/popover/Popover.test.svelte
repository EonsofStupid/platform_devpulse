<!--
  @file primitives/popover/Popover.test.svelte
  @layer primitives

  Test wrapper for Popover primitive.
  Provides a complete popover setup for testing.
-->
<script lang="ts">
import * as Popover from "./index.js";

interface Props {
	/** Popover open state (bindable) */
	open?: boolean;
	/** Trigger button text */
	triggerText?: string;
	/** Content text */
	contentText?: string;
	/** Close button text */
	closeText?: string;
	/** Open on hover */
	openOnHover?: boolean;
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
	/** Close on escape */
	closeOnEscape?: boolean;
	/** Close on outside click */
	closeOnOutsideClick?: boolean;
	/** Show arrow */
	showArrow?: boolean;
	/** Callback when close is clicked */
	onClose?: () => void;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** data-id for content */
	"data-id"?: string;
}

let {
	open = $bindable(false),
	triggerText = "Open Popover",
	contentText = "Popover content here.",
	closeText = "Close",
	openOnHover = false,
	openDelay = 700,
	closeDelay = 300,
	side = "bottom",
	sideOffset = 4,
	align = "center",
	closeOnEscape = true,
	closeOnOutsideClick = true,
	showArrow = false,
	onClose,
	onOpenChange,
	"data-id": dataId,
}: Props = $props();
</script>

<Popover.Root bind:open {onOpenChange}>
  <Popover.Trigger {openOnHover} {openDelay} {closeDelay}>
    {triggerText}
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      {side}
      {sideOffset}
      {align}
      {closeOnEscape}
      {closeOnOutsideClick}
      data-id={dataId}
    >
      <p>{contentText}</p>
      {#if showArrow}
        <Popover.Arrow />
      {/if}
      <Popover.Close onclick={onClose}>{closeText}</Popover.Close>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>

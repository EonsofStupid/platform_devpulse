<!--
  @file primitives/tooltip/Root.svelte
  @layer primitives

  Tooltip root - manages open/closed state.
  Hover-triggered by default (unlike Popover).

  NOTE: Includes implicit Provider for Bits UI context.
  Users don't need to wrap in Provider manually.

  Data Attributes:
  - data-kind="tooltip"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
import { Tooltip } from "meltui";
import type { TooltipRootProps, TooltipState } from "./types.js";

let {
	open = $bindable(false),
	onOpenChange,
	onOpenChangeComplete,
	delayDuration = 700,
	disableHoverableContent = false,
	disableCloseOnTriggerClick = false,
	disabled = false,
	ignoreNonKeyboardFocus = false,
	children,
	"data-id": dataId,
}: TooltipRootProps = $props();

const dataState: TooltipState = $derived(open ? "open" : "closed");
</script>

<div
  data-kind="tooltip"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <Tooltip.Provider {delayDuration} {disableHoverableContent} {disableCloseOnTriggerClick} {disabled} {ignoreNonKeyboardFocus}>
    <Tooltip.Root bind:open {onOpenChange} {onOpenChangeComplete} {delayDuration} {disableHoverableContent} {disableCloseOnTriggerClick} {disabled} {ignoreNonKeyboardFocus}>
      {#if children}
        {@render children()}
      {/if}
    </Tooltip.Root>
  </Tooltip.Provider>
</div>

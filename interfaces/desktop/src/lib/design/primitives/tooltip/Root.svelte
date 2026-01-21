<!--
  @file primitives/tooltip/Root.svelte
  @layer primitives

  Tooltip root - manages open/closed state.
  Hover-triggered by default (unlike Popover).

  NOTE: Includes implicit Provider for Bits UI context.
  Users don't need to wrap in Provider manually.

  Data Attributes:
  - data-primitive="tooltip"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import type { TooltipRootProps, TooltipState } from "./types.js";

  let {
    open = $bindable(false),
    onOpenChange,
    openDelay = 700,
    closeDelay = 300,
    children,
    "data-id": dataId,
  }: TooltipRootProps = $props();

  const dataState: TooltipState = $derived(open ? "open" : "closed");
</script>

<div
  data-primitive="tooltip"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  <Tooltip.Provider delayDuration={openDelay} {closeDelay}>
    <Tooltip.Root bind:open {onOpenChange} {openDelay} {closeDelay}>
      {#if children}
        {@render children()}
      {/if}
    </Tooltip.Root>
  </Tooltip.Provider>
</div>

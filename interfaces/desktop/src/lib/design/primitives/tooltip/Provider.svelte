<!--
  @file primitives/tooltip/Provider.svelte
  @layer primitives

  Tooltip provider - sets default delays for all child tooltips.
  Optional - use when you need consistent delays across multiple tooltips.

  Data Attributes:
  - data-primitive="tooltip"
  - data-slot="provider"
-->
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import type { TooltipProviderProps } from "./types.js";

  let {
    delayDuration = 700,
    closeDelay = 300,
    disableCloseOnTriggerClick = false,
    skipDelayDuration,
    disableHoverableContent = false,
    children,
    "data-id": dataId,
  }: TooltipProviderProps = $props();
</script>

<div
  data-primitive="tooltip"
  data-slot="provider"
  data-id={dataId}
>
  <Tooltip.Provider
    {delayDuration}
    {closeDelay}
    {disableCloseOnTriggerClick}
    {skipDelayDuration}
    {disableHoverableContent}
  >
    {#if children}
      {@render children()}
    {/if}
  </Tooltip.Provider>
</div>

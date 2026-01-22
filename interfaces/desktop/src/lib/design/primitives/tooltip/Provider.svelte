<!--
  @file primitives/tooltip/Provider.svelte
  @layer primitives

  Tooltip provider - sets default delays for all child tooltips.
  Optional - use when you need consistent delays across multiple tooltips.

  Data Attributes:
  - data-kind="tooltip"
  - data-slot="provider"
-->
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import type { TooltipProviderProps } from "./types.js";

  let {
    delayDuration = 700,
    skipDelayDuration = 300,
    disableCloseOnTriggerClick = false,
    disableHoverableContent = false,
    disabled = false,
    ignoreNonKeyboardFocus = false,
    children,
    "data-id": dataId,
  }: TooltipProviderProps = $props();
</script>

<div
  data-kind="tooltip"
  data-slot="provider"
  data-id={dataId}
>
  <Tooltip.Provider
    {delayDuration}
    {skipDelayDuration}
    {disableCloseOnTriggerClick}
    {disableHoverableContent}
    {disabled}
    {ignoreNonKeyboardFocus}
  >
    {#if children}
      {@render children()}
    {/if}
  </Tooltip.Provider>
</div>

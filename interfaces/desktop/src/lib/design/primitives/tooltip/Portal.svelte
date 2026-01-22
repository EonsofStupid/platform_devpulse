<!--
  @file primitives/tooltip/Portal.svelte
  @layer primitives

  Tooltip portal - renders content to document.body.

  Data Attributes:
  - data-kind="tooltip"
  - data-slot="portal"
-->
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import type { TooltipPortalProps } from "./types.js";

  let {
    to,
    disabled = false,
    children,
    "data-id": dataId,
  }: TooltipPortalProps = $props();
</script>

<div
  data-kind="tooltip"
  data-slot="portal"
  data-id={dataId}
>
  <Tooltip.Portal {to} {disabled}>
    {#if children}
      {@render children()}
    {/if}
  </Tooltip.Portal>
</div>

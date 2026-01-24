<!--
  @file primitives/tooltip/Arrow.svelte
  @layer primitives

  Tooltip arrow - visual indicator pointing to trigger.

  Data Attributes:
  - data-kind="tooltip"
  - data-slot="arrow"
  - data-tooltip-arrow=""
-->
<script lang="ts">
  import { Tooltip } from "bits-ui";
  import type { TooltipArrowProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    class: className = "",
    "data-id": dataId,
    width = 8,
    height = 8,
    ...rest
  }: TooltipArrowProps = $props();

  stripStyleProp(rest, "Tooltip.Arrow");
</script>

<Tooltip.Arrow
  class={className}
  data-kind="tooltip"
  data-slot="arrow"
  data-id={dataId}
  {width}
  {height}
  {...rest}
  data-tooltip-arrow=""
/>

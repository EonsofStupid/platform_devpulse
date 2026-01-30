<!--
  @file primitives/popover/Arrow.svelte
  @layer primitives

  Popover arrow - visual indicator pointing to trigger.

  Data Attributes:
  - data-kind="popover"
  - data-slot="arrow"
  - data-popover-arrow=""
-->
<script lang="ts">
  import { Popover } from "meltui";
  import type { PopoverArrowProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    class: className = "",
    "data-id": dataId,
    width = 8,
    height = 8,
    ...rest
  }: PopoverArrowProps = $props();

  stripStyleProp(rest, "Popover.Arrow");
</script>

<Popover.Arrow
  class={className}
  data-kind="popover"
  data-slot="arrow"
  data-id={dataId}
  {width}
  {height}
  {...rest}
  data-popover-arrow=""
/>

<!--
  @file primitives/select/Arrow.svelte
  @layer primitives

  Select arrow - visual indicator pointing to trigger.

  Data Attributes:
  - data-kind="select"
  - data-slot="arrow"
  - data-select-arrow=""
-->
<script lang="ts">
  import { FloatingLayerArrow } from "../_internal/index.js";
  import type { SelectArrowProps } from "./types.js";
  import { stripStyleProp } from "../types.js";

  let {
    ref = $bindable(null),
    class: className = "",
    "data-id": dataId,
    width = 8,
    height = 8,
    ...rest
  }: SelectArrowProps = $props();

  stripStyleProp(rest, "Select.Arrow");
</script>

<FloatingLayerArrow
  bind:ref
  class={className}
  data-kind="select"
  data-slot="arrow"
  data-id={dataId}
  {width}
  {height}
  {...rest}
  data-select-arrow=""
/>

<!--
  @file primitives/select/Arrow.svelte
  @layer primitives

  Select arrow - visual indicator pointing to trigger.
  ColdLight-owned component (meltui Select doesn't export Arrow).

  Data Attributes:
  - data-kind="select"
  - data-slot="arrow"
  - data-select-arrow=""
-->
<script lang="ts">
import { stripStyleProp } from "../types.js";
import type { SelectArrowProps } from "./types.js";

let {
	class: className = "",
	"data-id": dataId,
	width = 8,
	height = 8,
	...rest
}: SelectArrowProps = $props();

stripStyleProp(rest, "Select.Arrow");
</script>

<!--
  Simple arrow SVG positioned by CSS.
  Requires positioning context from parent (Select.Content).
-->
<svg
  class={className}
  data-kind="select"
  data-slot="arrow"
  data-id={dataId}
  data-select-arrow=""
  {width}
  {height}
  viewBox="0 0 8 8"
  fill="currentColor"
  aria-hidden="true"
  {...rest}
>
  <polygon points="0,0 4,4 8,0" />
</svg>

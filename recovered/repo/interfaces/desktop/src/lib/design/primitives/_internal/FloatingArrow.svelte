<!--
  @file primitives/_internal/FloatingArrow.svelte
  @layer primitives

  Shared floating arrow component for positioned primitives.
  Wraps bits-ui's FloatingLayerArrow with ColdLight data attributes.

  MUST be used inside a floating content component (PopperLayer context).

  Usage:
  ```svelte
  <FloatingArrow
    primitive="select"
    width={8}
    height={8}
    data-id="my-arrow"
  />
  ```

  Data Attributes:
  - data-kind="{primitive}"
  - data-slot="arrow"
  - data-{primitive}-arrow=""
-->
<script lang="ts">
  import { FloatingLayerArrow } from "./index.js";
  import type { HTMLAttributes } from "svelte/elements";

  interface FloatingArrowProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children"> {
    /** Which primitive this arrow belongs to */
    primitive: string;
    /** Reference to the arrow element (bindable) */
    ref?: HTMLElement | null;
    /** Arrow width in pixels (default: 8) */
    width?: number;
    /** Arrow height in pixels (default: 8) */
    height?: number;
    /** User-defined stable ID */
    "data-id"?: string;
  }

  let {
    primitive,
    ref = $bindable(null),
    class: className = "",
    "data-id": dataId,
    width = 8,
    height = 8,
    ...rest
  }: FloatingArrowProps = $props();

  // Dynamic data attribute for primitive-specific targeting
  const primitiveArrowAttr = $derived(`data-${primitive}-arrow`);
</script>

<FloatingLayerArrow
  bind:ref
  class={className}
  data-kind={primitive}
  data-slot="arrow"
  data-id={dataId}
  {width}
  {height}
  {...{ [primitiveArrowAttr]: "" }}
  {...rest}
/>

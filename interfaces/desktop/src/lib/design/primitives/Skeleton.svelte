<!--
  @file primitives/Skeleton.svelte
  @layer primitives

  Loading skeleton placeholder.
  NEVER focusable, hidden from screen readers.
  Parent container should have aria-busy="true" while loading.

  A11y Acceptance: NOT reachable by Tab, NOT announced by SR
-->
<script lang="ts">
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** Width of skeleton */
    width?: string;
    /** Height of skeleton */
    height?: string;
  }

  let {
    width,
    height,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Skeleton");
</script>

<div
  aria-hidden="true"
  tabindex="-1"
  class={className}
  data-kind="primitive"
  data-name="Skeleton"
  data-part="root"
  data-id={id}
  {...rest}
></div>

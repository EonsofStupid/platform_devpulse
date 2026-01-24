<!--
  @file primitives/ButtonGroup.svelte
  @layer primitives

  Group of related buttons with required aria-label.

  A11y Acceptance: SR announces as group with label
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
    /** REQUIRED: Label describing the button group */
    "aria-label": string;
    children?: Snippet;
  }

  let {
    "aria-label": ariaLabel,
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "ButtonGroup");
</script>

<div
  role="group"
  aria-label={ariaLabel}
  class={className}
  data-kind="primitive"
  data-name="ButtonGroup"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</div>

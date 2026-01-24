<!--
  @file primitives/Badge.svelte
  @layer primitives

  Badge primitive - visual label only, NO role.
  NOT a live region. SR treats as normal text.

  A11y Acceptance: SR treats as normal text (no live region announcement)
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLSpanElement>, BaseProps {
    children?: Snippet;
  }

  let {
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Badge");
</script>

<span
  class={className}
  data-kind="primitive"
  data-name="Badge"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</span>

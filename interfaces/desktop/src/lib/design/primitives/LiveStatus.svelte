<!--
  @file primitives/LiveStatus.svelte
  @layer primitives

  Live status announcer with role="status".
  Use ONLY when content changes should announce to screen readers.
  For visual-only labels, use Badge instead.

  A11y Acceptance: SR announces content changes politely
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

  stripStyleProp(rest, "LiveStatus");
</script>

<span
  role="status"
  class={className}
  data-kind="primitive"
  data-name="LiveStatus"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</span>

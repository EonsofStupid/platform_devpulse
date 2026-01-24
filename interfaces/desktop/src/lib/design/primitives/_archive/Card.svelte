<!--
  @file primitives/Card.svelte
  @layer primitives

  Card container with semantic article element.
  Auto-links to heading via aria-labelledby when headingId provided.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLElement>, BaseProps {
    /** ID of the heading element for aria-labelledby */
    headingId?: string;
    children?: Snippet;
  }

  let {
    headingId,
    children,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Card");
</script>

<article
  aria-labelledby={headingId}
  class={className}
  data-kind="primitive"
  data-name="Card"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</article>

<!--
  @file primitives/VisuallyHidden.svelte
  @layer primitives

  Screen-reader-only content. Visually hidden but accessible.
  Uses CSS clip technique, NOT display:none (which hides from SR).
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

let { children, class: className = "", "data-id": id, ...rest }: Props = $props();

stripStyleProp(rest, "VisuallyHidden");
</script>

<span
  class="sr-only {className}"
  data-kind="primitive"
  data-name="VisuallyHidden"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</span>

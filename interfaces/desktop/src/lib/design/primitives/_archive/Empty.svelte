<!--
  @file primitives/Empty.svelte
  @layer primitives

  Empty state placeholder with polite live region.
  Announces to screen readers when content becomes empty.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

let { children, class: className = "", "data-id": id, ...rest }: Props = $props();

stripStyleProp(rest, "Empty");
</script>

<div
  role="status"
  aria-live="polite"
  class={className}
  data-kind="primitive"
  data-name="Empty"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</div>

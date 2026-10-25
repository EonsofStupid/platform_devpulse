<!--
  @file primitives/Kbd.svelte
  @layer primitives

  Keyboard key indicator using semantic kbd element.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLElement>, BaseProps {
	children?: Snippet;
}

let { children, class: className = "", "data-id": id, ...rest }: Props = $props();

stripStyleProp(rest, "Kbd");
</script>

<kbd
  class={className}
  data-kind="primitive"
  data-name="Kbd"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</kbd>

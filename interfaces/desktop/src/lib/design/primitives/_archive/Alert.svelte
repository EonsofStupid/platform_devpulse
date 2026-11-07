<!--
  @file primitives/Alert.svelte
  @layer primitives

  Alert primitive with baked-in ARIA.
  role="alert" implies aria-live="assertive" - DO NOT add redundant aria-live.

  A11y Acceptance: Announces ONCE (not twice), SR reads role="alert"
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

let { children, class: className = "", "data-id": id, ...rest }: Props = $props();

stripStyleProp(rest, "Alert");
</script>

<div
  role="alert"
  aria-atomic="true"
  class={className}
  data-kind="primitive"
  data-name="Alert"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</div>

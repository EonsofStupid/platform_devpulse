<!--
  @file primitives/Chart.svelte
  @layer primitives

  Chart container with required aria-label for accessibility.
  Uses figure element with role="img" for screen readers.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "./types.js";
import { stripStyleProp } from "./types.js";

interface Props extends OmitStyle<HTMLElement>, BaseProps {
	/** REQUIRED: Description of the chart for screen readers */
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

stripStyleProp(rest, "Chart");
</script>

<figure
  role="img"
  aria-label={ariaLabel}
  class={className}
  data-kind="primitive"
  data-name="Chart"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</figure>

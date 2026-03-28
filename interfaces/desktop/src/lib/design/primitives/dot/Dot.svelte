<!--
  @component Dot
  @kind dot
  @layer primitive
  @category structural
  @description Colored circle indicator. The simplest visual atom.
  Size and color applied via class or inline style.
  Used by StatusDot (adds status→color mapping), health indicators, accent dots.

  @element span
  @slots root
-->
<script lang="ts">
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "$lib/design/utils/cn.js";

interface DotProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	class?: string;
	/** Dot diameter. Default: 0.5rem */
	size?: string;
	/** Dot color. CSS value or var() reference */
	color?: string;
	/** Glow halo using the same color */
	glow?: boolean;
	/** Pulse animation */
	animate?: boolean;
}

let {
	class: className,
	size = "0.5rem",
	color = "currentColor",
	glow = false,
	animate = false,
	...rest
}: DotProps = $props();
</script>

<span
	data-kind="dot"
	data-slot="root"
	class={cn(
		"inline-block rounded-full shrink-0",
		animate && "animate-pulse",
		className,
	)}
	style="width: {size}; height: {size}; background: {color};{glow ? ` box-shadow: 0 0 0.375rem ${color};` : ''}"
	aria-hidden="true"
	{...rest}
></span>

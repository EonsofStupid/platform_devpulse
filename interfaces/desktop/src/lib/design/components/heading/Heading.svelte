<!--
	@component Heading
	@kind heading
	@layer component
	@category content
	@description Semantic heading element for section titles with configurable level and visual size
	@container false
	@compound false
	@blockCategory content
	@defaultStyle heading-default
	@styleIds heading-default, heading-stark, heading-glass, heading-flat, heading-matte
	@requiredAxes typography, color
	@slots root:all
	@defaults {
		"background-color": "transparent",
		"box-shadow": "none",
		"border-width": "0",
		"color": "var(--text-primary)"
}
-->
<script lang="ts">
import { headingAnatomy, useHeading } from "$lib/design/behaviors/display/heading/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { HeadingProps, HeadingSize } from "./heading.types.js";

const SIZE: Record<HeadingSize, string> = {
	xs: "text-xs",
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
	"3xl": "text-3xl",
	// Layman-facing hero copy — one step above 3xl. Used by the
	// first-run setup view's stage heading.
	display: "text-4xl",
};

const WEIGHT: Record<number, string> = {
	1: "font-bold",
	2: "font-bold",
	3: "font-semibold",
	4: "font-semibold",
	5: "font-medium",
	6: "font-medium",
};

let {
	preset = "default",
	level = 2,
	size = "lg",
	children,
	class: className,
	...rest
}: HeadingProps = $props();

const heading = $derived(useHeading({ level }));
const m = $derived(renderForge({ kind: "heading", preset }));
const tag = $derived(`h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6");
</script>

<svelte:element
	this={tag}
	{...headingAnatomy.attrs.root}
	{...heading.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn(WEIGHT[level] ?? WEIGHT[2], SIZE[size] ?? SIZE.lg, className)}
>
	{@render children?.()}
</svelte:element>

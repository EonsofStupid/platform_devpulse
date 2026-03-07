<!--
	@component SvgBlank
	@file design/svg/blanks/SvgBlank.svelte
	@layer svg
	@package @devpulse/coldlight

	Parametric SVG blank: renders an SVG shape as visual background
	with filter chains applied, and HTML content composited on top.

	Shape + filters provide true neumorphism. HTML content is fully
	interactive — the SVG layer is purely decorative (aria-hidden).

	Performance: Each blank with filters counts toward the ~10 SVG-filtered
	element budget per viewport. Use CSS molecules for non-premium surfaces.

	@example
	<SvgBlank shape="rect" radius={12} filters={["bevel-medium", "noise-subtle"]}>
		<PanelContent />
	</SvgBlank>
-->
<script lang="ts">
	import type { Snippet } from "svelte";
	import type { BlankShape } from "../_schema/types.js";
	import { getShape } from "./shapes/index.js";

	interface Props {
		/** Shape to render: "rect" | "pill" | "circle" | "hexagon" */
		shape?: BlankShape;
		/** Width — CSS value or number for px */
		width?: string | number;
		/** Height — CSS value or number for px */
		height?: string | number;
		/** Border radius for rect shapes (px) */
		radius?: number;
		/** SVG filter IDs to apply (chained) */
		filters?: string[];
		/** Fill color (OKLCH token reference or CSS color) */
		fill?: string;
		/** Stroke color */
		stroke?: string;
		/** Stroke width */
		strokeWidth?: number;
		/** Additional CSS classes on the wrapper */
		class?: string;
		/** Content to render on top of the SVG background */
		children?: Snippet;
	}

	let {
		shape = "rect",
		width = "100%",
		height = "100%",
		radius = 12,
		filters = [],
		fill = "var(--glass-void)",
		stroke = "none",
		strokeWidth = 0,
		class: className = "",
		children,
	}: Props = $props();

	// Build the CSS filter string from filter IDs
	const filterAttr = $derived(
		filters.length > 0
			? filters.map((id) => `url(#${id})`).join(" ")
			: undefined
	);

	// Resolve numeric dimensions for viewBox
	const w = $derived(typeof width === "number" ? width : 300);
	const h = $derived(typeof height === "number" ? height : 200);

	// Get shape output from generator
	const shapeOutput = $derived(getShape(shape)(w, h, radius));

	// Wrapper style
	const wrapperStyle = $derived(
		`position:relative;width:${typeof width === "string" ? width : width + "px"};height:${typeof height === "string" ? height : height + "px"};`
	);
</script>

<div class="svg-blank {className}" style={wrapperStyle}>
	<!-- SVG background layer (decorative) -->
	<svg
		aria-hidden="true"
		style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"
		viewBox="0 0 {w} {h}"
		preserveAspectRatio="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<svelte:element
			this={shapeOutput.tag}
			{...shapeOutput.attrs}
			fill={fill}
			stroke={stroke}
			stroke-width={strokeWidth}
			filter={filterAttr}
		/>
	</svg>

	<!-- HTML content layer -->
	<div style="position:relative;z-index:1;width:100%;height:100%;">
		{@render children?.()}
	</div>
</div>

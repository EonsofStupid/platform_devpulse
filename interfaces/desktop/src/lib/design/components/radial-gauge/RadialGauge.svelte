<!--
	@component RadialGauge
	@kind radial-gauge
	@render svg
	@category data-viz
	@description SVG radial gauge for dashboard data visualization.
	Renders a glowing circular progress ring with value display.
	Uses SvgStyleMacro resolver — all visual values from DTCG presets.

	@defaultStyle radial-gauge-default
	@styleIds radial-gauge-default, radial-gauge-glass, radial-gauge-stark, radial-gauge-flat, radial-gauge-matte

	@example
	<RadialGauge value={75} max={100} label="CPU" accent="teal" intent="glass" />
-->
<script lang="ts">
import { resolveSvgMacro } from "$lib/design/svg/index.js";
import type { RadialGaugeProps } from "./radial-gauge.types.js";

let {
	value = 0,
	max = 100,
	label = "",
	unit = "%",
	accent = "teal",
	preset = "default",
	size = 180,
	strokeWidth = 8,
	class: className = "",
	children: _,
	...rest
}: RadialGaugeProps = $props();

// SVG macro resolver — pure $derived, no wrapper component
const svg = $derived(resolveSvgMacro({ kind: "radial-gauge", intent: preset, accent }));

// Geometry (structural — not visual axes)
const cx = $derived(size / 2);
const cy = $derived(size / 2);
const radius = $derived((size - strokeWidth * 2 - 8) / 2);
const circumference = $derived(2 * Math.PI * radius);
const pct = $derived(Math.min(Math.max(value / max, 0), 1));
const dashOffset = $derived(circumference * (1 - pct));
const displayValue = $derived(Math.round(value));
</script>

<div class="relative inline-flex items-center justify-center {className}" data-kind="radial-gauge" data-slot="root" {...rest}>
	<svg
		width={size}
		height={size}
		viewBox="0 0 {size} {size}"
		xmlns="http://www.w3.org/2000/svg"
		style={svg.style}
		data-svg-kind={svg.attrs["data-svg-kind"]}
		data-svg-intent={svg.attrs["data-svg-intent"]}
		data-svg-accent={svg.attrs["data-svg-accent"]}
	>
		<!-- Background track -->
		<circle
			{cx}
			{cy}
			r={radius}
			fill="none"
			stroke="var(--svg-track-stroke)"
			stroke-width={strokeWidth}
			opacity="var(--svg-track-opacity)"
			data-svg-slot="track"
		/>

		<!-- Progress ring with glow -->
		<circle
			{cx}
			{cy}
			r={radius}
			fill="none"
			stroke="var(--svg-stroke)"
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={dashOffset}
			transform="rotate(-90 {cx} {cy})"
			style="filter: drop-shadow(0 0 var(--svg-glow-blur) var(--svg-glow-color)); transition: stroke-dashoffset var(--svg-transition);"
			data-svg-slot="value"
		/>

		<!-- Outer glow ring (subtle accent border) -->
		<circle
			{cx}
			{cy}
			r={radius + strokeWidth / 2 + 2}
			fill="none"
			stroke="var(--svg-glow-color)"
			stroke-width="1"
			opacity="var(--svg-glow-opacity, 0.3)"
			data-svg-slot="glow-ring"
		/>

		<!-- Tick marks -->
		{#each Array(12) as _, i}
			{@const angle = (i * 30 - 90) * (Math.PI / 180)}
			{@const x1 = cx + (radius + strokeWidth / 2 + 4) * Math.cos(angle)}
			{@const y1 = cy + (radius + strokeWidth / 2 + 4) * Math.sin(angle)}
			{@const x2 = cx + (radius + strokeWidth / 2 + 1) * Math.cos(angle)}
			{@const y2 = cy + (radius + strokeWidth / 2 + 1) * Math.sin(angle)}
			<line
				{x1} {y1} {x2} {y2}
				stroke="var(--svg-track-stroke)"
				stroke-width="1"
				data-svg-slot="tick"
			/>
		{/each}
	</svg>

	<!-- Center value display -->
	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span
			class="text-2xl font-bold tabular-nums"
			style="font-family: var(--svg-font-family); color: var(--svg-text-color); text-shadow: 0 0 var(--svg-text-glow-blur) var(--svg-text-glow-color);"
		>
			{displayValue}{unit}
		</span>
		{#if label}
			<span class="mt-1 text-xs" style="color: var(--text-muted);">
				{label}
			</span>
		{/if}
	</div>
</div>

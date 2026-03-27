<!--
	@component SparkLine
	@kind spark-line
	@render svg
	@category data-viz
	@description SVG sparkline / mini chart for dashboard data visualization.
	Renders a smooth line with optional area fill and glow effect.
	Uses SvgStyleMacro resolver — all visual values from DTCG presets.

	@defaultStyle spark-line-default
	@styleIds spark-line-default, spark-line-glass, spark-line-stark, spark-line-flat, spark-line-matte

	@example
	<SparkLine data={[10, 25, 18, 32, 28, 45, 38]} accent="teal" intent="glass" />
-->
<script lang="ts">
import { resolveSvgMacro } from "$lib/design/svg/index.js";
import type { SparkLineProps } from "./spark-line.types.js";

let {
	data = [],
	accent = "teal",
	preset = "default",
	width = 200,
	height = 60,
	area = true,
	lineWidth = 2,
	glow = true,
	class: className = "",
}: SparkLineProps = $props();

// SVG macro resolver — pure $derived
const svg = $derived(resolveSvgMacro({ kind: "spark-line", intent: preset, accent }));

const padding = 4;

const points = $derived.by(() => {
	if (data.length < 2) return "";
	const minVal = Math.min(...data);
	const maxVal = Math.max(...data);
	const range = maxVal - minVal || 1;
	const xStep = (width - padding * 2) / (data.length - 1);

	return data
		.map((v, i) => {
			const x = padding + i * xStep;
			const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
			return `${x},${y}`;
		})
		.join(" ");
});

const areaPath = $derived.by(() => {
	if (data.length < 2) return "";
	const minVal = Math.min(...data);
	const maxVal = Math.max(...data);
	const range = maxVal - minVal || 1;
	const xStep = (width - padding * 2) / (data.length - 1);

	const pts = data.map((v, i) => {
		const x = padding + i * xStep;
		const y = height - padding - ((v - minVal) / range) * (height - padding * 2);
		return `${x},${y}`;
	});

	return `M ${pts[0]} L ${pts.join(" L ")} L ${padding + (data.length - 1) * xStep},${height - padding} L ${padding},${height - padding} Z`;
});
</script>

<svg
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	class="block {className}"
	xmlns="http://www.w3.org/2000/svg"
	style={svg.style}
	data-svg-kind={svg.attrs["data-svg-kind"]}
	data-svg-intent={svg.attrs["data-svg-intent"]}
	data-svg-accent={svg.attrs["data-svg-accent"]}
>
	{#if glow}
		<defs>
			<filter id="spark-glow-{accent}" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="3" />
			</filter>
		</defs>
	{/if}

	<!-- Area fill -->
	{#if area && areaPath}
		<path
			d={areaPath}
			fill="var(--cl-svg-fill)"
			fill-opacity="var(--cl-svg-fill-opacity)"
			data-svg-slot="area"
		/>
	{/if}

	<!-- Glow line (behind) -->
	{#if glow && points}
		<polyline
			{points}
			fill="none"
			stroke="var(--cl-svg-glow-color)"
			stroke-width={lineWidth + 4}
			stroke-linejoin="round"
			stroke-linecap="round"
			filter="url(#spark-glow-{accent})"
			data-svg-slot="glow"
		/>
	{/if}

	<!-- Main line -->
	{#if points}
		<polyline
			{points}
			fill="none"
			stroke="var(--cl-svg-stroke)"
			stroke-width={lineWidth}
			stroke-linejoin="round"
			stroke-linecap="round"
			data-svg-slot="line"
		/>
	{/if}

	<!-- End dot -->
	{#if data.length > 0}
		{@const minVal = Math.min(...data)}
		{@const maxVal = Math.max(...data)}
		{@const range = maxVal - minVal || 1}
		{@const lastX = padding + (data.length - 1) * ((width - padding * 2) / (data.length - 1))}
		{@const lastY = height - padding - ((data[data.length - 1] - minVal) / range) * (height - padding * 2)}
		<circle
			cx={lastX}
			cy={lastY}
			r="3"
			fill="var(--cl-svg-stroke)"
			style="filter: drop-shadow(0 0 var(--cl-svg-glow-blur) var(--cl-svg-glow-color));"
			data-svg-slot="dot"
		/>
	{/if}
</svg>

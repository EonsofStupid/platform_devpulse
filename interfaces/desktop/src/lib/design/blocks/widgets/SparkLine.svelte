<!--
	@component SparkLine
	@kind widget
	@layer blocks

	SVG sparkline / mini chart for dashboard visualizations.
	Renders a smooth line with optional area fill and glow effect.
	Uses ColdLight design tokens exclusively.

	@example
	<SparkLine data={[10, 25, 18, 32, 28, 45, 38]} accent="teal" />

	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
type Accent = "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";

interface Props {
	/** Data points (y-values) */
	data?: number[];
	/** Accent color */
	accent?: Accent;
	/** Chart width */
	width?: number;
	/** Chart height */
	height?: number;
	/** Show area fill under the line */
	area?: boolean;
	/** Line stroke width */
	lineWidth?: number;
	/** Show glow effect */
	glow?: boolean;
	/** Additional CSS classes */
	class?: string;
}

let {
	data = [],
	accent = "teal",
	width = 200,
	height = 60,
	area = true,
	lineWidth = 2,
	glow = true,
	class: className = "",
}: Props = $props();

/** Accent colors — resolved from SD5 component tokens (--accent-{color}-{role}) */
const accentColors: Record<Accent, { main: string; glow: string; fill: string }> = {
	teal: {
		main: "var(--accent-teal-main)",
		glow: "var(--accent-teal-glow)",
		fill: "var(--accent-teal-fill)",
	},
	purple: {
		main: "var(--accent-purple-main)",
		glow: "var(--accent-purple-glow)",
		fill: "var(--accent-purple-fill)",
	},
	magenta: {
		main: "var(--accent-magenta-main)",
		glow: "var(--accent-magenta-glow)",
		fill: "var(--accent-magenta-fill)",
	},
	ember: {
		main: "var(--accent-ember-main)",
		glow: "var(--accent-ember-glow)",
		fill: "var(--accent-ember-fill)",
	},
	frost: {
		main: "var(--accent-frost-main)",
		glow: "var(--accent-frost-glow)",
		fill: "var(--accent-frost-fill)",
	},
	cyber: {
		main: "var(--accent-cyber-main)",
		glow: "var(--accent-cyber-glow)",
		fill: "var(--accent-cyber-fill)",
	},
};

const padding = 4;
const colors = $derived(accentColors[accent]);

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
		<path d={areaPath} fill={colors.fill} />
	{/if}

	<!-- Glow line (behind) -->
	{#if glow && points}
		<polyline
			{points}
			fill="none"
			stroke={colors.glow}
			stroke-width={lineWidth + 4}
			stroke-linejoin="round"
			stroke-linecap="round"
			filter="url(#spark-glow-{accent})"
		/>
	{/if}

	<!-- Main line -->
	{#if points}
		<polyline
			{points}
			fill="none"
			stroke={colors.main}
			stroke-width={lineWidth}
			stroke-linejoin="round"
			stroke-linecap="round"
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
			fill={colors.main}
			style="filter: drop-shadow(0 0 4px {colors.glow});"
		/>
	{/if}
</svg>

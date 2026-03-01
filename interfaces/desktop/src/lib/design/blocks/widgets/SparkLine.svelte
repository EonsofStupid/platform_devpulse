<!--
	@component SparkLine
	@kind widget
	@layer blocks

	SVG sparkline / mini chart for dashboard visualizations.
	Renders a smooth line with optional area fill and glow effect.
	Uses ColdLight design tokens exclusively.

	@example
	<SparkLine data={[10, 25, 18, 32, 28, 45, 38]} accent="teal" />
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

	const accentColors: Record<Accent, { main: string; glow: string; fill: string }> = {
		teal: { main: "oklch(0.64 0.16 180)", glow: "oklch(0.55 0.18 180 / 0.5)", fill: "oklch(0.55 0.18 180 / 0.15)" },
		purple: { main: "oklch(0.64 0.16 280)", glow: "oklch(0.55 0.18 280 / 0.5)", fill: "oklch(0.55 0.18 280 / 0.15)" },
		magenta: { main: "oklch(0.64 0.18 330)", glow: "oklch(0.55 0.20 330 / 0.5)", fill: "oklch(0.55 0.20 330 / 0.15)" },
		ember: { main: "oklch(0.64 0.16 25)", glow: "oklch(0.55 0.18 25 / 0.5)", fill: "oklch(0.55 0.18 25 / 0.15)" },
		frost: { main: "oklch(0.68 0.08 220)", glow: "oklch(0.58 0.10 220 / 0.5)", fill: "oklch(0.58 0.10 220 / 0.15)" },
		cyber: { main: "oklch(0.64 0.16 160)", glow: "oklch(0.55 0.18 160 / 0.5)", fill: "oklch(0.55 0.18 160 / 0.15)" },
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

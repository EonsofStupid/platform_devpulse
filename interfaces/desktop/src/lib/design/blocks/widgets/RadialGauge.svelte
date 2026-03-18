<!--
	@component RadialGauge
	@kind widget
	@layer blocks

	SVG radial gauge for dashboard visualizations.
	Renders a glowing circular progress ring with value display.
	Uses ColdLight design tokens exclusively.

	@example
	<RadialGauge value={75} max={100} label="CPU" accent="teal" />
-->
<script lang="ts">
type Accent = "teal" | "purple" | "magenta" | "ember" | "frost" | "cyber";

interface Props {
	/** Current value */
	value?: number;
	/** Maximum value */
	max?: number;
	/** Gauge label */
	label?: string;
	/** Display unit */
	unit?: string;
	/** Accent color */
	accent?: Accent;
	/** Diameter in px */
	size?: number;
	/** Ring stroke width */
	strokeWidth?: number;
	/** Additional CSS classes */
	class?: string;
}

let {
	value = 0,
	max = 100,
	label = "",
	unit = "%",
	accent = "teal",
	size = 180,
	strokeWidth = 8,
	class: className = "",
}: Props = $props();

/** Accent colors — resolved from SD5 component tokens (--accent-{color}-{role}) */
const accentColors: Record<Accent, { main: string; glow: string }> = {
	teal: { main: "var(--accent-teal-main)", glow: "var(--accent-teal-glow)" },
	purple: { main: "var(--accent-purple-main)", glow: "var(--accent-purple-glow)" },
	magenta: { main: "var(--accent-magenta-main)", glow: "var(--accent-magenta-glow)" },
	ember: { main: "var(--accent-ember-main)", glow: "var(--accent-ember-glow)" },
	frost: { main: "var(--accent-frost-main)", glow: "var(--accent-frost-glow)" },
	cyber: { main: "var(--accent-cyber-main)", glow: "var(--accent-cyber-glow)" },
};

const cx = $derived(size / 2);
const cy = $derived(size / 2);
const radius = $derived((size - strokeWidth * 2 - 8) / 2);
const circumference = $derived(2 * Math.PI * radius);
const pct = $derived(Math.min(Math.max(value / max, 0), 1));
const dashOffset = $derived(circumference * (1 - pct));
const colors = $derived(accentColors[accent]);
const displayValue = $derived(Math.round(value));
</script>

<div class="relative inline-flex items-center justify-center {className}">
	<svg
		width={size}
		height={size}
		viewBox="0 0 {size} {size}"
		xmlns="http://www.w3.org/2000/svg"
	>
		<!-- Background track -->
		<circle
			{cx}
			{cy}
			r={radius}
			fill="none"
			stroke="var(--svg-track-stroke)"
			stroke-width={strokeWidth}
		/>

		<!-- Progress ring with glow -->
		<circle
			{cx}
			{cy}
			r={radius}
			fill="none"
			stroke={colors.main}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={dashOffset}
			transform="rotate(-90 {cx} {cy})"
			style="filter: drop-shadow(0 0 8px {colors.glow}) drop-shadow(0 0 20px {colors.glow}); transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);"
		/>

		<!-- Outer glow ring (subtle) -->
		<circle
			{cx}
			{cy}
			r={radius + strokeWidth / 2 + 2}
			fill="none"
			stroke={colors.glow}
			stroke-width="1"
			opacity="0.3"
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
				stroke="var(--svg-track-tick-stroke)"
				stroke-width="1"
			/>
		{/each}
	</svg>

	<!-- Center value display -->
	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span
			class="text-2xl font-bold tabular-nums"
			style="font-family: var(--font-display); color: {colors.main}; text-shadow: 0 0 12px {colors.glow};"
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

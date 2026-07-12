<!--
	@component DuckdbHero
	@module @devpulse/devtools/system/datastores/duckdb/feature

	DuckDB's hero visualization — animated columnar bars that suggest
	analytical work in motion. Twelve vertical bars at varying heights,
	each shifting on a long ease loop so the pattern feels alive
	without being busy. Columnar database identity: stacked,
	analytical, breathing.

	## Health-driven motion

	- **up**: long sine wave across the bar set, ~6 s loop. Subtle
	  amber glow on each bar peak.
	- **starting / degraded**: faster cycle (~2 s), tone shifts toward
	  the semantic signal color via color-mix.
	- **down**: bars freeze at low height + lose glow.
	- **unknown**: all bars at uniform low height, no motion.

	## Why not a real chart

	A live chart would need real telemetry feeding it (row counts, query
	latency histogram). That comes later. The hero visualization's job
	is identity + liveness signal, not data. Twelve animated bars do
	that without any data plumbing — they read as "DuckDB, analytical,
	working" before any numbers exist.

	Respects `prefers-reduced-motion` — collapses to static bars at
	varying heights.
-->
<script lang="ts">
type HealthState = "up" | "starting" | "degraded" | "down" | "unknown";

interface Props {
	state: HealthState;
}

let { state }: Props = $props();

// Twelve bars with hand-picked phase offsets so the wave reads as a
// flowing pattern rather than random noise. Heights cycle between
// 30 % and 95 % over the loop duration.
const BARS = [
	{ phase: 0.0, baseHeight: 60 },
	{ phase: 0.08, baseHeight: 75 },
	{ phase: 0.16, baseHeight: 85 },
	{ phase: 0.24, baseHeight: 92 },
	{ phase: 0.32, baseHeight: 85 },
	{ phase: 0.4, baseHeight: 72 },
	{ phase: 0.48, baseHeight: 55 },
	{ phase: 0.56, baseHeight: 42 },
	{ phase: 0.64, baseHeight: 38 },
	{ phase: 0.72, baseHeight: 45 },
	{ phase: 0.8, baseHeight: 58 },
	{ phase: 0.88, baseHeight: 70 },
];

const containerClass = $derived(`hero-bars hero-bars-${state}`);
</script>

<div class={containerClass}>
	{#each BARS as bar, i (i)}
		<div
			class="bar"
			style={`--bar-base: ${bar.baseHeight}%; --bar-phase: ${bar.phase}; --bar-index: ${i};`}
		></div>
	{/each}
</div>

<style>
	.hero-bars {
		display: flex;
		align-items: flex-end;
		gap: 0.25rem;
		height: 3.5rem;
		padding: 0.25rem 0;
	}
	.bar {
		flex: 1;
		min-width: 0.25rem;
		height: var(--bar-base);
		background: linear-gradient(
			180deg,
			color-mix(in oklch, var(--store-accent, var(--accent-primary-main)) 80%, transparent) 0%,
			color-mix(in oklch, var(--store-accent, var(--accent-primary-main)) 30%, transparent) 100%
		);
		border-radius: 0.125rem 0.125rem 0 0;
		transform-origin: bottom;
		animation: bar-breathe 6s ease-in-out infinite;
		animation-delay: calc(var(--bar-phase) * -6s);
	}

	@keyframes bar-breathe {
		0%, 100% {
			transform: scaleY(1);
			filter: brightness(0.85);
		}
		50% {
			transform: scaleY(0.5);
			filter: brightness(1.15);
		}
	}

	.hero-bars-starting .bar,
	.hero-bars-degraded .bar {
		animation-duration: 2s;
	}
	.hero-bars-degraded .bar {
		background: linear-gradient(
			180deg,
			color-mix(in oklch, var(--signal-warning) 70%, transparent) 0%,
			color-mix(in oklch, var(--signal-warning) 25%, transparent) 100%
		);
	}
	.hero-bars-down .bar {
		animation: none;
		opacity: 0.4;
		transform: scaleY(0.55);
		filter: grayscale(0.5);
	}
	.hero-bars-unknown .bar {
		animation: none;
		opacity: 0.3;
		height: 35%;
		background: linear-gradient(
			180deg,
			color-mix(in oklch, var(--text-muted) 50%, transparent) 0%,
			color-mix(in oklch, var(--text-muted) 20%, transparent) 100%
		);
	}

	@media (prefers-reduced-motion: reduce) {
		.bar {
			animation: none;
		}
	}
</style>

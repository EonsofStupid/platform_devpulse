<!--
	@component TursoHero
	@module @devpulse/devtools/system/datastores/turso/feature

	Turso's hero visualization — a relational grid that ripples
	left-to-right. Eighteen cells in a 6×3 layout, each carrying a
	phase offset so a horizontal wave reads across the grid every
	four seconds. Reads as "rows + tables alive."

	## Health-driven motion

	- **up**: all 18 cells lit, slow left-to-right ripple (~4 s loop),
	  cyan glow
	- **starting**: faster ripple (~1.5 s), all cells lit
	- **degraded**: ~30 % of cells dim out per cycle, mimicking partial
	  database reachability
	- **down**: cells all dim + static
	- **unknown**: cells uniformly muted

	Respects `prefers-reduced-motion` — falls back to static lit cells.

	## Why a grid (not a table viz with real row counts)

	A real row-count display needs telemetry plumbing that doesn't
	exist yet. The hero's job is identity + liveness, not data. An
	abstract row-grid that ripples does that — "this is a relational
	store, it's alive" — without any data plumbing.
-->
<script lang="ts">
type HealthState = "up" | "starting" | "degraded" | "down" | "unknown";

interface Props {
	state: HealthState;
}

let { state }: Props = $props();

// 18 cells in row-major order with phase offsets stepped by column
// position so the wave reads horizontally. Two cells per row share a
// phase so the ripple feels like a sweep rather than a Mexican wave.
const CELLS = Array.from({ length: 18 }, (_, i) => {
	const col = i % 6;
	const row = Math.floor(i / 6);
	return {
		phase: col / 6 + row * 0.05,
		col,
		row,
	};
});

const containerClass = $derived(`hero-grid hero-grid-${state}`);
</script>

<div class={containerClass}>
	{#each CELLS as cell, i (i)}
		<div class="cell" style={`--cell-phase: ${cell.phase};`}></div>
	{/each}
</div>

<style>
	.hero-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-template-rows: repeat(3, 1fr);
		gap: 0.25rem;
		height: 3.5rem;
		padding: 0.25rem 0;
	}
	.cell {
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--accent-cyan, cyan) 65%, transparent) 0%,
			color-mix(in oklch, var(--accent-cyan, cyan) 25%, transparent) 100%
		);
		border-radius: 0.1875rem;
		opacity: 0.85;
		animation: cell-ripple 4s ease-in-out infinite;
		animation-delay: calc(var(--cell-phase) * -4s);
	}

	@keyframes cell-ripple {
		0%, 100% {
			opacity: 0.55;
			transform: scale(0.9);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
			filter: brightness(1.15);
		}
	}

	.hero-grid-starting .cell {
		animation-duration: 1.5s;
	}
	.hero-grid-degraded .cell {
		animation-duration: 1.5s;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--signal-warning) 55%, transparent) 0%,
			color-mix(in oklch, var(--signal-warning) 20%, transparent) 100%
		);
	}
	.hero-grid-degraded .cell:nth-child(3n) {
		opacity: 0.25;
		animation: none;
	}
	.hero-grid-down .cell {
		animation: none;
		opacity: 0.3;
		filter: grayscale(0.6);
	}
	.hero-grid-unknown .cell {
		animation: none;
		opacity: 0.25;
		background: linear-gradient(
			135deg,
			color-mix(in oklch, var(--text-muted) 40%, transparent) 0%,
			color-mix(in oklch, var(--text-muted) 15%, transparent) 100%
		);
	}

	@media (prefers-reduced-motion: reduce) {
		.cell {
			animation: none;
		}
	}
</style>

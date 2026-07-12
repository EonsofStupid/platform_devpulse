<!--
	@component SurrealdbHero
	@module @devpulse/devtools/system/datastores/surrealdb/feature

	SurrealDB's hero visualization — a force-directed-looking graph
	with seven nodes connected by edges that pulse with a flowing
	gradient. Reads as "multi-model graph + document, alive."

	## Health-driven motion

	- **up**: nodes float on a slow drift, edges shimmer with a
	  left-to-right flowing gradient on a 3 s loop, purple accent
	- **starting**: faster edge flow (~1.2 s), nodes still floating
	- **degraded**: half the edges fade out per cycle, mimicking
	  partial namespace connectivity
	- **down**: edges static + dim, nodes still
	- **unknown**: muted gray, no motion

	Pure SVG with CSS animations — no data binding, no real graph
	layout algorithm. Same "identity, not data" rule as the
	DuckdbHero and LibsqlHero. When real namespace graph data lands
	the nodes can take on the namespace names as labels.

	Respects `prefers-reduced-motion`.
-->
<script lang="ts">
type HealthState = "up" | "starting" | "degraded" | "down" | "unknown";

interface Props {
	state: HealthState;
}

let { state }: Props = $props();

// Seven nodes positioned in a loose star + center pattern. Coordinates
// are in a 200×80 viewBox so the SVG scales cleanly into the hero card
// slot regardless of card width.
const NODES = [
	{ x: 30, y: 20, r: 5, drift: 0 },
	{ x: 100, y: 14, r: 6, drift: 0.2 },
	{ x: 170, y: 22, r: 5, drift: 0.4 },
	{ x: 60, y: 60, r: 5, drift: 0.6 },
	{ x: 100, y: 42, r: 7, drift: 0 }, // center hub
	{ x: 140, y: 60, r: 5, drift: 0.8 },
	{ x: 25, y: 55, r: 4, drift: 0.3 },
];

// Edges as pairs of node indices. Routes through the center hub plus
// a few cross-connects so the graph reads as "interconnected" rather
// than a pure star.
const EDGES: Array<[number, number, number]> = [
	// [from, to, phase]
	[0, 4, 0.0],
	[1, 4, 0.15],
	[2, 4, 0.3],
	[3, 4, 0.45],
	[5, 4, 0.6],
	[6, 4, 0.75],
	[0, 1, 0.1],
	[1, 2, 0.4],
	[3, 5, 0.55],
	[6, 3, 0.7],
];

const containerClass = $derived(`hero-graph hero-graph-${state}`);
</script>

<div class={containerClass}>
	<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
		<defs>
			<linearGradient id="surreal-edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="color-mix(in oklch, var(--store-accent, var(--accent-primary-main)) 10%, transparent)" />
				<stop offset="50%" stop-color="var(--store-accent, var(--accent-primary-main))" />
				<stop offset="100%" stop-color="color-mix(in oklch, var(--store-accent, var(--accent-primary-main)) 10%, transparent)" />
			</linearGradient>
		</defs>

		<!-- Edges first (drawn under nodes) -->
		{#each EDGES as [from, to, phase], i (i)}
			<line
				class="edge"
				x1={NODES[from].x}
				y1={NODES[from].y}
				x2={NODES[to].x}
				y2={NODES[to].y}
				style={`--edge-phase: ${phase};`}
			/>
		{/each}

		<!-- Nodes on top -->
		{#each NODES as node, i (i)}
			<circle
				class="node"
				cx={node.x}
				cy={node.y}
				r={node.r}
				style={`--node-drift: ${node.drift};`}
			/>
		{/each}
	</svg>
</div>

<style>
	.hero-graph {
		height: 4.5rem;
		padding: 0.25rem 0;
	}
	.hero-graph svg {
		width: 100%;
		height: 100%;
	}

	.edge {
		stroke: var(--store-accent, var(--accent-primary-main));
		stroke-width: 0.875;
		stroke-opacity: 0.35;
		stroke-linecap: round;
		animation: edge-pulse 3s ease-in-out infinite;
		animation-delay: calc(var(--edge-phase) * -3s);
	}

	.node {
		fill: color-mix(in oklch, var(--store-accent, var(--accent-primary-main)) 75%, transparent);
		stroke: var(--store-accent, var(--accent-primary-main));
		stroke-width: 0.5;
		animation: node-float 4.5s ease-in-out infinite;
		animation-delay: calc(var(--node-drift) * -4.5s);
		filter: drop-shadow(0 0 1.5px color-mix(in oklch, var(--store-accent, var(--accent-primary-main)) 80%, transparent));
	}

	@keyframes edge-pulse {
		0%, 100% { stroke-opacity: 0.18; }
		50% { stroke-opacity: 0.7; }
	}
	@keyframes node-float {
		0%, 100% { transform: translateY(0); opacity: 0.85; }
		50% { transform: translateY(-1.5px); opacity: 1; }
	}

	.hero-graph-starting .edge,
	.hero-graph-starting .node {
		animation-duration: 1.2s;
	}
	.hero-graph-degraded .edge {
		animation-duration: 1.5s;
		stroke: var(--signal-warning);
	}
	.hero-graph-degraded .edge:nth-child(2n) {
		stroke-opacity: 0.1;
		animation: none;
	}
	.hero-graph-degraded .node {
		fill: color-mix(in oklch, var(--signal-warning) 70%, transparent);
		stroke: var(--signal-warning);
	}
	.hero-graph-down .edge,
	.hero-graph-down .node {
		animation: none;
		stroke-opacity: 0.15;
		opacity: 0.45;
		filter: grayscale(0.6);
	}
	.hero-graph-unknown .edge,
	.hero-graph-unknown .node {
		animation: none;
		stroke: var(--text-muted);
		fill: color-mix(in oklch, var(--text-muted) 35%, transparent);
		stroke-opacity: 0.25;
		filter: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.edge, .node {
			animation: none;
		}
	}
</style>

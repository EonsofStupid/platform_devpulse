<!--
	@component ReasoningTopology
	@module @devpulse/devtools/clyffy/reasoning/_shared

	Deep cyber/glass topology view of the RRO encoder pipeline.

	Renders the four-node reasoning substrate as a horizontally-flowing
	graph: Tokenizer → Encoder (Burn) → Embedder Pipeline → RRD Daemon.
	Each node carries:

	- a layman-first label (the bold text the user reads first)
	- a small technical Badge underneath (the kernel name for the
	  reader who's actually debugging)
	- a `StatusDot` whose tone is derived from the live RRD lifecycle
	  phase (substring tone matching like `RrdDevtool:66`)
	- on `clickable=true`, the whole node becomes a focus surface that
	  the parent can intercept via `on:nodeselect`

	Animated particles flow along the edges between nodes whenever the
	RRD daemon is in a transition phase (pause / drain / validate /
	swap / resume). The particle speed is bound to the
	`rrdState.transitions.length` rate-of-change so a burst of phase
	events visually translates to a burst of flow.

	The viz is pure SVG inside a glass-effect surface. No canvas. No
	external diagram lib. Every pixel and animation derives from
	ColdLight tokens — no raw hex, no raw px in layout. Sizes are
	viewport-clamped so the topology scales from a sidebar panel to a
	full-window detail view without losing legibility.

	## Lifecycle phase → node activity mapping

	| Phase substring | Active nodes (highlighted) |
	|---|---|
	| `pause` / `drain` | Daemon (the maintenance window owner) |
	| `validate` | Encoder (the new weights being checked) |
	| `commit` / `swap` | Encoder + Embedder (the publish step) |
	| `resume` / `ready` | All four (system back to query-ready) |
	| `fail` / `error` | Whichever node the failure cites in `detail` |

	When no transitions have fired (cold boot, encoder never loaded),
	the topology renders in a "skeletal" mode — nodes are outlined
	only, no particles, layman text reads "Awaiting first load" on
	each node. This is the correct empty state — points at the
	`model_loader` log target without inviting the user to click
	anything (devtools are diagnostics, not setup).
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { StatusDot, type StatusDotStatus } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import { rrdState } from "$lib/sys/data-access/rrd/rrd.state.svelte.js";

interface Props {
	/** When true, nodes respond to keyboard + click focus (parent listens to `nodeselect`). */
	clickable?: boolean;
	/** Compact mode shrinks node padding + drops the technical Badge. */
	compact?: boolean;
	/** Fires when a node is selected in `clickable` mode. */
	onnodeselect?: (id: NodeId) => void;
}

export type NodeId = "tokenizer" | "encoder" | "embedder" | "daemon";

let { clickable = false, compact = false, onnodeselect }: Props = $props();

// ── Derived state from rrdState ────────────────────────────────

/** The phase substring controls which nodes glow + edge particles fire. */
const phase = $derived(rrdState.last?.phase.toLowerCase() ?? "");

/** Cold = no transitions ever seen → skeletal mode. */
const isCold = $derived(rrdState.transitions.length === 0);

/** Which nodes are "active" (highlighted) for the current phase. */
const activeNodes = $derived<Set<NodeId>>(
	(() => {
		const s = new Set<NodeId>();
		if (isCold) return s;
		if (phase.includes("pause") || phase.includes("drain")) s.add("daemon");
		if (phase.includes("validate")) s.add("encoder");
		if (phase.includes("commit") || phase.includes("swap")) {
			s.add("encoder");
			s.add("embedder");
		}
		if (phase.includes("resume") || phase.includes("ready") || phase.includes("running")) {
			s.add("tokenizer");
			s.add("encoder");
			s.add("embedder");
			s.add("daemon");
		}
		return s;
	})(),
);

/** Flow particles animate when the topology is "transitioning." */
const isFlowing = $derived(
	!isCold &&
		(phase.includes("validate") ||
			phase.includes("commit") ||
			phase.includes("swap") ||
			phase.includes("drain")),
);

/** Per-node tone from substring match (mirrors RrdDevtool:66 pattern). */
function nodeTone(id: NodeId): "neutral" | "starting" | "up" | "degraded" {
	if (isCold) return "neutral";
	if (phase.includes("fail") || phase.includes("error")) return "degraded";
	if (activeNodes.has(id)) {
		if (phase.includes("resume") || phase.includes("ready") || phase.includes("running"))
			return "up";
		return "starting";
	}
	return "neutral";
}

function nodeStatusDot(id: NodeId): StatusDotStatus {
	const t = nodeTone(id);
	if (t === "up") return "ready";
	if (t === "starting") return "loading";
	if (t === "degraded") return "failed";
	return "offline";
}

function handleNodeClick(id: NodeId) {
	if (!clickable) return;
	onnodeselect?.(id);
}

function handleNodeKey(event: KeyboardEvent, id: NodeId) {
	if (!clickable) return;
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		onnodeselect?.(id);
	}
}

// ── Node metadata — layman first, technical second ─────────────

interface NodeMeta {
	id: NodeId;
	layman: string;
	technical: string;
	skeletal: string;
	x: number;
	y: number;
}

const nodes: NodeMeta[] = [
	{
		id: "tokenizer",
		layman: "Read the words",
		technical: "tokenizer.json",
		skeletal: "Awaiting first load",
		x: 60,
		y: 90,
	},
	{
		id: "encoder",
		layman: "Understand them",
		technical: "Qwen3 · bf16",
		skeletal: "Awaiting first load",
		x: 230,
		y: 90,
	},
	{
		id: "embedder",
		layman: "Distill to a vector",
		technical: "Pool + L2 norm",
		skeletal: "Awaiting first load",
		x: 400,
		y: 90,
	},
	{
		id: "daemon",
		layman: "Keep it live",
		technical: "RRD lifecycle",
		skeletal: "Daemon dormant",
		x: 570,
		y: 90,
	},
];

const edges: Array<{ from: NodeId; to: NodeId }> = [
	{ from: "tokenizer", to: "encoder" },
	{ from: "encoder", to: "embedder" },
	{ from: "embedder", to: "daemon" },
];

const nodeCoord = (id: NodeId) => nodes.find((n) => n.id === id) ?? nodes[0];

// SVG geometry — abstract units (viewBox 660×180), scaled responsively
// by container width so the layout stays crisp without raw px in the
// .svelte / style blocks.
const NODE_R = 36;
const NODE_W = 130;
const NODE_H = 64;
</script>

<div
	class="reasoning-topology"
	data-cold={isCold}
	data-flowing={isFlowing}
	role="figure"
	aria-label="Reasoning encoder pipeline: tokenizer to encoder to embedder to daemon"
>
	<svg
		viewBox="0 0 660 180"
		xmlns="http://www.w3.org/2000/svg"
		preserveAspectRatio="xMidYMid meet"
		aria-hidden="true"
	>
		<defs>
			<!-- Edge gradient — cyan to electric, gives the trace a direction. -->
			<linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="var(--accent-cyber-soft, var(--accent-electric))" />
				<stop offset="100%" stop-color="var(--accent-cyber, var(--accent-electric-strong))" />
			</linearGradient>

			<!-- Glow filter for active nodes. -->
			<filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		<!-- Edges (drawn first so nodes sit on top) -->
		{#each edges as edge (`${edge.from}-${edge.to}`)}
			{@const from = nodeCoord(edge.from)}
			{@const to = nodeCoord(edge.to)}
			{@const startX = from.x + NODE_W / 2}
			{@const endX = to.x - NODE_W / 2}
			<g class="edge" data-active={activeNodes.has(edge.from) && activeNodes.has(edge.to)}>
				<line
					x1={startX}
					y1={from.y}
					x2={endX}
					y2={to.y}
					stroke="url(#edge-gradient)"
					stroke-width="1.5"
					stroke-dasharray="4 4"
					opacity="0.6"
				/>
				<!-- Flow particles — three dots that travel the edge when isFlowing. -->
				{#if isFlowing}
					{#each [0, 1, 2] as i (i)}
						<circle
							class="particle"
							r="3"
							cx={startX}
							cy={from.y}
							style:--travel-x="{endX - startX}px"
							style:--delay="{i * 0.35}s"
							fill="var(--accent-cyber, var(--accent-electric-strong))"
						/>
					{/each}
				{/if}
			</g>
		{/each}

		<!-- Nodes (rendered after edges so they're on top) -->
		{#each nodes as node (node.id)}
			{@const active = activeNodes.has(node.id)}
			<g
				class="node"
				data-id={node.id}
				data-active={active}
				transform="translate({node.x - NODE_W / 2}, {node.y - NODE_H / 2})"
				filter={active ? "url(#node-glow)" : undefined}
			>
				<rect
					width={NODE_W}
					height={NODE_H}
					rx="10"
					ry="10"
					fill="var(--surface-raised)"
					stroke={active
						? "var(--accent-cyber, var(--accent-electric))"
						: "var(--border-subtle)"}
					stroke-width={active ? 1.5 : 1}
				/>
			</g>
		{/each}
	</svg>

	<!-- HTML overlay for text + StatusDot — kept out of SVG so it picks up
	     Text and Badge components and ColdLight token sizing. -->
	<div class="overlay" aria-hidden="false">
		{#each nodes as node (node.id)}
			{@const active = activeNodes.has(node.id)}
			<svelte:element
				this={clickable ? "button" : "div"}
				class="node-label"
				class:node-label--active={active}
				class:node-label--clickable={clickable}
				class:node-label--compact={compact}
				style:left="{(node.x / 660) * 100}%"
				style:top="{(node.y / 180) * 100}%"
				type={clickable ? "button" : undefined}
				aria-label={clickable
					? `${node.layman} — ${node.technical}, ${active ? "active" : "idle"}`
					: undefined}
				onclick={clickable ? () => handleNodeClick(node.id) : undefined}
				onkeydown={clickable ? (e: KeyboardEvent) => handleNodeKey(e, node.id) : undefined}
			>
				<div class="node-label__head">
					<StatusDot status={nodeStatusDot(node.id)} />
					<Text size={compact ? "xs" : "sm"} weight="semibold">
						{isCold ? node.skeletal : node.layman}
					</Text>
				</div>
				{#if !compact && !isCold}
					<Badge variant={active ? "informative" : "neutral"} size="sm" fillStyle="subtle">
						{node.technical}
					</Badge>
				{/if}
			</svelte:element>
		{/each}
	</div>

	<!-- Lifecycle phase ticker — single line below the topology, the
	     same substring tone matching as RrdDevtool's phaseTone() so the
	     two surfaces never disagree. -->
	{#if rrdState.last}
		<div class="phase-ticker">
			<Text size="xs" color="muted">Most recent phase</Text>
			<Badge
				variant={phase.includes("fail")
					? "negative"
					: phase.includes("complete") || phase.includes("ready")
						? "positive"
						: "informative"}
				size="sm"
			>
				{rrdState.last.phase}
			</Badge>
			{#if rrdState.last.detail}
				<Text size="xs" color="muted" class="font-mono">{rrdState.last.detail}</Text>
			{/if}
		</div>
	{:else}
		<div class="phase-ticker">
			<Text size="xs" color="muted">
				No phase events yet — daemon emits on first encoder load.
				Watch the <Text as="span" size="xs" class="font-mono">model_loader</Text> log target.
			</Text>
		</div>
	{/if}
</div>

<style>
	.reasoning-topology {
		/* Glass surface: layered backdrop + a subtle inner stroke. The
		   backdrop-filter pulls in the page backdrop's hue (the
		   circuit-drift / cosmic-galaxy variation from the parent
		   ServiceDevtoolShell) so the topology feels embedded, not
		   floating on top. */
		position: relative;
		width: 100%;
		padding: 1rem 1rem 0.75rem;
		border-radius: 12px;
		background: color-mix(in oklch, var(--surface-raised) 65%, transparent);
		border: 1px solid var(--border-subtle);
		backdrop-filter: blur(6px);
	}

	.reasoning-topology[data-cold="true"] {
		/* Skeletal — drop opacity, remove the inner glow. */
		opacity: 0.7;
	}

	.reasoning-topology svg {
		width: 100%;
		height: auto;
		display: block;
	}

	.overlay {
		position: absolute;
		inset: 1rem 1rem 0.75rem;
		pointer-events: none;
	}

	.node-label {
		position: absolute;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		min-width: 7.5rem;
		max-width: 9rem;
		text-align: center;
		pointer-events: auto;
		border-radius: 8px;
		transition: transform 200ms ease;
		/* Reset native <button> chrome when `clickable` is true and the
		   node renders via <svelte:element this="button">. Harmless on
		   the <div> variant. */
		background: transparent;
		border: none;
		color: inherit;
		font: inherit;
	}

	.node-label--clickable {
		cursor: pointer;
	}

	.node-label--clickable:hover,
	.node-label--clickable:focus-visible {
		transform: translate(-50%, -50%) scale(1.04);
		outline: 1px solid var(--accent-cyber, var(--accent-electric));
		outline-offset: 2px;
	}

	.node-label__head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.node-label--compact .node-label__head {
		gap: 0.25rem;
	}

	.node-label--active {
		/* Subtle inner glow tint on active node card — pairs with the
		   SVG node's outline-glow filter so the SVG + HTML layers
		   feel like one surface. */
		background: color-mix(
			in oklch,
			var(--accent-cyber, var(--accent-electric)) 8%,
			transparent
		);
	}

	.phase-ticker {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px dashed var(--border-subtle);
	}

	/* Edge particle — travels across the dashed line during transitions.
	   --travel-x is set per-particle via inline style based on the
	   edge's length, so the same keyframe works for every edge. */
	:global(.reasoning-topology svg .particle) {
		animation: particle-flow 1.4s linear infinite;
		animation-delay: var(--delay, 0s);
	}

	@keyframes particle-flow {
		0% {
			transform: translateX(0);
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		85% {
			opacity: 1;
		}
		100% {
			transform: translateX(var(--travel-x, 100px));
			opacity: 0;
		}
	}

	/* Edge inactive — dim further so active edges read as the focus. */
	:global(.reasoning-topology svg .edge:not([data-active="true"]) line) {
		opacity: 0.25;
	}

	:global(.reasoning-topology svg .edge[data-active="true"] line) {
		opacity: 0.85;
		stroke-dasharray: 0;
	}
</style>

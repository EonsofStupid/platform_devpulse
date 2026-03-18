<!--
	@file VPB Graph — AST Node Editor
	@layer vpb

	@xyflow/svelte integration for block tree visualization.
	Renders BlockNode tree as a connected node graph.
-->
<script lang="ts">
import { Background, Controls, MiniMap, SvelteFlow } from "@xyflow/svelte";
import "@xyflow/svelte/dist/style.css";
import { vpbDocument } from "../state/vpb-document.svelte.js";
import { blockTreeToFlow } from "./blockToFlow.js";
import VpbBlockNode from "./VpbBlockNode.svelte";
import VpbSlotEdge from "./VpbSlotEdge.svelte";

// biome-ignore lint/suspicious/noExplicitAny: SvelteFlow nodeTypes requires Record<string, any>
const nodeTypes = { vpbBlock: VpbBlockNode } as Record<string, any>;
// biome-ignore lint/suspicious/noExplicitAny: SvelteFlow edgeTypes requires Record<string, any>
const edgeTypes = { slot: VpbSlotEdge } as Record<string, any>;

const flowData = $derived(blockTreeToFlow(vpbDocument.document.root));

let nodes = $state.raw([] as typeof flowData.nodes);
let edges = $state.raw([] as typeof flowData.edges);

$effect(() => {
	nodes = flowData.nodes;
	edges = flowData.edges;
});
</script>

<div class="vpb-graph">
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		{edgeTypes}
		fitView
		minZoom={0.25}
		maxZoom={2}
		defaultEdgeOptions={{ animated: true }}
	>
		<Controls />
		<MiniMap
			style="background: var(--vpb-graph-bg);"
			nodeColor="var(--vpb-graph-node-color)"
		/>
		<Background gap={20} />
	</SvelteFlow>
</div>

<style>
	.vpb-graph {
		width: 100%;
		height: 100%;
	}
	.vpb-graph :global(.svelte-flow) {
		background: var(--vpb-graph-bg) !important;
	}
</style>

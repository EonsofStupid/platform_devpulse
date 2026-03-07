<!--
	@file VPB Graph — AST Node Editor
	@layer vpb

	@xyflow/svelte integration for block tree visualization.
	Renders BlockNode tree as a connected node graph.
-->
<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		MiniMap,
		Background,
	} from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";
	import VpbBlockNode from "./VpbBlockNode.svelte";
	import VpbSlotEdge from "./VpbSlotEdge.svelte";
	import { blockTreeToFlow } from "./blockToFlow.js";
	import { vpbDocument } from "../state/vpb-document.svelte.js";

	const nodeTypes = { vpbBlock: VpbBlockNode } as Record<string, any>;
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

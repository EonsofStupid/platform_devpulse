<!--
	@file VPB Block Node — Custom SvelteFlow Node
	@layer vpb

	Compact card for each BlockNode in the AST graph.
	Shows kind, recipe, and slot handles.
-->
<script lang="ts">
import { Handle, Position } from "@xyflow/svelte";
import { vpbDocument } from "../state/vpb-document.svelte.js";
import type { VpbFlowNode } from "./types.js";

let { data, id }: { data: VpbFlowNode["data"]; id: string } = $props();

const isSelected = $derived(vpbDocument.selectedNodeId === id);

function formatKind(kind: string): string {
	return kind
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}
</script>

<Handle type="target" position={Position.Left} />

<div
	class="vpb-gnode"
	class:vpb-gnode--selected={isSelected}
	role="button"
	tabindex="0"
	onclick={() => vpbDocument.selectNode(id)}
	onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vpbDocument.selectNode(id); }}}
>
	<div class="vpb-gnode__kind">{formatKind(data.blockNode.kind)}</div>
	<div class="vpb-gnode__recipe">{data.blockNode.recipe}</div>
	{#if data.slotName}
		<div class="vpb-gnode__slot">slot: {data.slotName}</div>
	{/if}
</div>

<Handle type="source" position={Position.Right} />

<style>
	.vpb-gnode {
		padding: 8px 12px;
		border: 1px solid var(--vpb-graph-node-border);
		border-radius: 6px;
		background: var(--vpb-graph-node-bg);
		backdrop-filter: blur(8px);
		min-width: 180px;
		cursor: pointer;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.vpb-gnode:hover {
		border-color: var(--vpb-graph-node-hover-border);
	}
	.vpb-gnode--selected {
		border-color: var(--vpb-graph-node-selected-border);
		box-shadow: 0 0 12px var(--vpb-graph-node-selected-glow);
	}
	.vpb-gnode__kind {
		font-size: 13px;
		font-weight: 600;
		color: var(--vpb-graph-node-kind-color);
	}
	.vpb-gnode__recipe {
		font-size: 10px;
		color: var(--vpb-graph-node-slot-color);
		font-family: monospace;
		margin-top: 2px;
	}
	.vpb-gnode__slot {
		font-size: 9px;
		color: var(--vpb-graph-node-type-color);
		margin-top: 2px;
	}
</style>

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

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="vpb-gnode"
	class:vpb-gnode--selected={isSelected}
	onclick={() => vpbDocument.selectNode(id)}
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
		border: 1px solid oklch(1 0 0 / 0.12);
		border-radius: 6px;
		background: oklch(0.12 0.02 220 / 0.95);
		backdrop-filter: blur(8px);
		min-width: 180px;
		cursor: pointer;
		transition: border-color 0.15s, box-shadow 0.15s;
	}
	.vpb-gnode:hover {
		border-color: oklch(0.5 0.1 180 / 0.4);
	}
	.vpb-gnode--selected {
		border-color: oklch(0.6 0.15 180);
		box-shadow: 0 0 12px oklch(0.5 0.15 180 / 0.25);
	}
	.vpb-gnode__kind {
		font-size: 13px;
		font-weight: 600;
		color: oklch(0.85 0.08 180);
	}
	.vpb-gnode__recipe {
		font-size: 10px;
		color: oklch(0.55 0 0);
		font-family: monospace;
		margin-top: 2px;
	}
	.vpb-gnode__slot {
		font-size: 9px;
		color: oklch(0.5 0.1 290);
		margin-top: 2px;
	}
</style>

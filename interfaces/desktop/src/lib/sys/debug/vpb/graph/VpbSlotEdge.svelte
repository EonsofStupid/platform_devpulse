<!--
	@file VPB Slot Edge — Custom SvelteFlow Edge
	@layer vpb

	Shows slot name on the edge connection between parent and child.
-->
<script lang="ts">
	import { BaseEdge, getBezierPath } from "@xyflow/svelte";

	let {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		data,
	}: {
		id: string;
		sourceX: number;
		sourceY: number;
		targetX: number;
		targetY: number;
		sourcePosition: string;
		targetPosition: string;
		data?: { slotName: string };
	} = $props();

	const pathData = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
			sourcePosition: sourcePosition as any,
			targetPosition: targetPosition as any,
		}),
	);

	const midX = $derived((sourceX + targetX) / 2);
	const midY = $derived((sourceY + targetY) / 2);
	const slotName = $derived(data?.slotName ?? "");
</script>

<BaseEdge {id} path={pathData[0]} style="stroke: var(--vpb-graph-edge-stroke); stroke-width: 1.5;" />
{#if slotName}
	<foreignObject x={midX - 30} y={midY - 10} width="60" height="20">
		<span class="vpb-edge-label">{slotName}</span>
	</foreignObject>
{/if}

<style>
	.vpb-edge-label {
		font-size: 9px;
		color: var(--vpb-graph-edge-label-color);
		background: var(--vpb-graph-edge-label-bg);
		padding: 1px 5px;
		border-radius: 3px;
		display: block;
		text-align: center;
		font-family: monospace;
	}
</style>

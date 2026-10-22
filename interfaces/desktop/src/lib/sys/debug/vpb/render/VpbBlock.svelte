<!--
	@file VpbBlock — Recursive Block Tree Renderer
	@layer vpb

	Renders a BlockNode the way ColdLight renders a component: `renderForge`
	for the node's preset gives the data attributes and canonical variables,
	and the node's axis props override them (VPB axis registry). Slot children
	render recursively.

	Replaces `BlockRenderer` + `resolveClasses` (deleted in 0020c1f4), which
	resolved recipe class strings.
-->
<script lang="ts">
import type { BlockNode } from "@devpulse/coldlight/blocks";
import { resolveNode, type VpbProps } from "../registry/vpb-axes.js";
import { vpbVisual } from "../state/vpb-visual.svelte.js";
import VpbBlock from "./VpbBlock.svelte";

let { node, depth = 0 }: { node: BlockNode; depth?: number } = $props();

const visual = $derived(resolveNode(node, node.props as VpbProps, vpbVisual.context));
const slotEntries = $derived(node.slots ? Object.entries(node.slots) : []);
</script>

<div
	class="vpb-block"
	{...visual.dataAttrs}
	style={visual.style}
	data-slot="root"
	data-block-id={node.id}
	data-depth={depth}
>
	<span class="vpb-block__label">{node.meta?.label ?? node.kind}</span>
	{#each slotEntries as [, children]}
		{#each children as child (child.id)}
			<VpbBlock node={child} depth={depth + 1} />
		{/each}
	{/each}
</div>

<style>
	.vpb-block {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-height: 48px;
		padding: 12px;
	}
	.vpb-block__label {
		font-size: 12px;
		font-family: monospace;
		color: var(--vpb-label-color);
	}
</style>

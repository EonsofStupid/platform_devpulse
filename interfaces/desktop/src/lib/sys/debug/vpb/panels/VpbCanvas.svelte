<!--
	@file VPB Canvas — Preview & Graph View
	@layer vpb

	Center panel with two modes:
	- Preview: renders BlockNode tree via VpbBlock (renderForge + axis props)
	- Graph: renders AST via @xyflow/svelte (Phase 6)
-->
<script lang="ts">
import VpbGraph from "../graph/VpbGraph.svelte";
import VpbBlock from "../render/VpbBlock.svelte";
import { vpbDocument } from "../state/vpb-document.svelte.js";

let { viewMode = "preview" }: { viewMode?: "preview" | "graph" } = $props();

function handleNodeClick(e: Event) {
	const target = e.target as HTMLElement;
	const blockEl = target.closest("[data-block-id]");
	if (blockEl) {
		const id = blockEl.getAttribute("data-block-id");
		vpbDocument.selectNode(id);
	}
}
</script>

{#if viewMode === "graph"}
	<div class="vpb-canvas vpb-canvas--graph">
		<VpbGraph />
	</div>
{:else}
	<div class="vpb-canvas" role="button" tabindex="0" onclick={handleNodeClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNodeClick(e); }}>
		{#if vpbDocument.document.root.length === 0}
			<div class="vpb-canvas__empty">
				<p class="vpb-canvas__empty-title">No blocks yet</p>
				<p class="vpb-canvas__empty-sub">Add components from the palette on the left</p>
			</div>
		{:else}
			<div class="vpb-canvas__preview">
				{#each vpbDocument.document.root as node (node.id)}
					<div
						class="vpb-canvas__block-wrapper"
						class:vpb-canvas__block-wrapper--selected={vpbDocument.selectedNodeId === node.id}
					>
						<VpbBlock {node} />
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.vpb-canvas {
		height: 100%;
		overflow-y: auto;
		padding: 16px;
		background: var(--vpb-bg);
	}
	.vpb-canvas__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 8px;
	}
	.vpb-canvas__empty-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--vpb-label-dim);
	}
	.vpb-canvas__empty-sub {
		font-size: 13px;
		color: var(--vpb-text-dim);
	}
	.vpb-canvas__preview {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.vpb-canvas__block-wrapper {
		border: 2px solid transparent;
		border-radius: 6px;
		transition: border-color 0.15s;
	}
	.vpb-canvas__block-wrapper--selected {
		border-color: var(--vpb-accent-teal);
	}
	.vpb-canvas--graph {
		padding: 0;
		overflow: hidden;
	}
</style>

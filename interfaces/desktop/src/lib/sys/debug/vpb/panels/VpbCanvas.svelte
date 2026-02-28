<!--
	@file VPB Canvas — Preview & Graph View
	@layer vpb

	Center panel with two modes:
	- Preview: renders BlockNode tree via BlockRenderer
	- Graph: renders AST via @xyflow/svelte (Phase 6)
-->
<script lang="ts">
	import { vpbDocument } from "../state/vpb-document.svelte.js";
	import BlockRenderer from "$lib/design/renderers/BlockRenderer.svelte";
	import VpbGraph from "../graph/VpbGraph.svelte";

	let { viewMode = "preview" }: { viewMode?: "preview" | "graph" } = $props();

	function handleNodeClick(e: MouseEvent) {
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
	<div class="vpb-canvas" role="button" tabindex="0" onclick={handleNodeClick} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNodeClick(e as any); }}>
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
						<BlockRenderer {node} />
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
		background: oklch(0.07 0.01 220);
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
		color: oklch(0.5 0 0);
	}
	.vpb-canvas__empty-sub {
		font-size: 13px;
		color: oklch(0.4 0 0);
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
		border-color: oklch(0.6 0.15 180);
	}
	.vpb-canvas--graph {
		padding: 0;
		overflow: hidden;
	}
</style>

<!--
	@file VPB Palette — Component Picker
	@layer vpb

	Left panel: category tabs, kind list, recipe picker.
	Click a kind to add a new BlockNode to the document.
-->
<script lang="ts">
	import { vpbPalette } from "../state/vpb-palette.svelte.js";
	import { vpbDocument } from "../state/vpb-document.svelte.js";
	import { createBlockNode } from "$lib/design/blocks/factory.js";

	function handleAddBlock(kind: string) {
		try {
			const node = createBlockNode(kind);
			vpbDocument.addNode(node);
		} catch (e) {
			// No recipe registered for this kind yet — show as disabled
			console.warn(`[VPB] Cannot add "${kind}":`, (e as Error).message);
		}
	}

	function formatKindName(kind: string): string {
		return kind
			.split("-")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");
	}
</script>

<div class="vpb-palette">
	<div class="vpb-palette__search">
		<input
			type="text"
			placeholder="Search components..."
			value={vpbPalette.searchQuery}
			oninput={(e) => vpbPalette.setSearch((e.target as HTMLInputElement).value)}
		/>
	</div>

	<div class="vpb-palette__categories">
		{#each vpbPalette.categories as category}
			<button
				class="vpb-palette__cat-btn"
				class:vpb-palette__cat-btn--active={vpbPalette.activeCategory === category}
				onclick={() => vpbPalette.setCategory(category)}
			>
				{category}
			</button>
		{/each}
	</div>

	<div class="vpb-palette__kinds">
		{#each vpbPalette.filteredKinds as kind}
			{@const recipes = vpbPalette.getRecipesForKind(kind)}
			<button
				class="vpb-palette__kind"
				class:vpb-palette__kind--disabled={recipes.length === 0}
				onclick={() => handleAddBlock(kind)}
				disabled={recipes.length === 0}
				title={recipes.length > 0 ? `Add ${kind} (${recipes.length} recipe${recipes.length > 1 ? "s" : ""})` : `${kind} — no recipes registered`}
			>
				<span class="vpb-palette__kind-name">{formatKindName(kind)}</span>
				<span class="vpb-palette__kind-count">{recipes.length}</span>
			</button>
		{/each}
		{#if vpbPalette.filteredKinds.length === 0}
			<p class="vpb-palette__empty">No components match "{vpbPalette.searchQuery}"</p>
		{/if}
	</div>
</div>

<style>
	.vpb-palette {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.vpb-palette__search {
		padding: 8px;
		border-bottom: 1px solid oklch(1 0 0 / 0.06);
	}
	.vpb-palette__search input {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid oklch(1 0 0 / 0.1);
		border-radius: 4px;
		background: oklch(1 0 0 / 0.04);
		color: inherit;
		font-size: 12px;
	}
	.vpb-palette__search input:focus {
		border-color: oklch(0.6 0.15 180);
		outline: none;
	}
	.vpb-palette__categories {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 6px 8px;
		border-bottom: 1px solid oklch(1 0 0 / 0.06);
	}
	.vpb-palette__cat-btn {
		padding: 3px 8px;
		border: 1px solid transparent;
		border-radius: 3px;
		background: transparent;
		color: oklch(0.7 0 0);
		font-size: 11px;
		text-transform: capitalize;
		cursor: pointer;
	}
	.vpb-palette__cat-btn:hover {
		background: oklch(1 0 0 / 0.06);
	}
	.vpb-palette__cat-btn--active {
		background: oklch(0.5 0.15 180 / 0.15);
		color: oklch(0.75 0.12 180);
		border-color: oklch(0.5 0.15 180 / 0.3);
	}
	.vpb-palette__kinds {
		flex: 1;
		overflow-y: auto;
		padding: 4px;
	}
	.vpb-palette__kind {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 6px 10px;
		border: 1px solid transparent;
		border-radius: 4px;
		background: transparent;
		color: inherit;
		font-size: 12px;
		cursor: pointer;
		text-align: left;
	}
	.vpb-palette__kind:hover:not(:disabled) {
		background: oklch(1 0 0 / 0.06);
		border-color: oklch(1 0 0 / 0.08);
	}
	.vpb-palette__kind--disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.vpb-palette__kind-name {
		font-weight: 500;
	}
	.vpb-palette__kind-count {
		font-size: 10px;
		color: oklch(0.6 0 0);
		background: oklch(1 0 0 / 0.06);
		padding: 1px 5px;
		border-radius: 3px;
	}
	.vpb-palette__empty {
		padding: 16px;
		text-align: center;
		color: oklch(0.5 0 0);
		font-size: 12px;
	}
</style>

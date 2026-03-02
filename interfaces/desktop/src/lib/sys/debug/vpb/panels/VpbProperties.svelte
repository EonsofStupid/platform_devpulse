<!--
	@file VPB Properties — Node Inspector Panel
	@layer vpb

	Right panel: shows selected node's ColdLight visual controls.
	Five tabs: Presets, Props (8-axis controls), Output (encoding/CSS), Contract, Recipes.

	Uses vpbVisual state bridge for live resolveVisual() integration.
-->
<script lang="ts">
	import { vpbDocument } from "../state/vpb-document.svelte.js";
	import { vpbVisual } from "../state/vpb-visual.svelte.js";
	import { getRecipesForKind } from "$lib/design/recipes/index.js";
	import PropControlFactory from "../controls/PropControlFactory.svelte";
	import VpbPresetPicker from "../controls/VpbPresetPicker.svelte";
	import VpbEncodingOutput from "../controls/VpbEncodingOutput.svelte";
	import VpbContractInspector from "./VpbContractInspector.svelte";
	import VpbRecipeLegend from "./VpbRecipeLegend.svelte";
	import {
		loadManifest,
		getPrimitiveFromManifest,
		getComponentFromManifest,
	} from "../manifest/manifest-reader.js";
	import type { ColdLightManifest } from "$lib/design/scanner.types.js";

	const node = $derived(vpbDocument.selectedNode);
	const recipes = $derived(node ? getRecipesForKind(node.kind) : []);

	let manifest = $state<ColdLightManifest | null>(null);
	const primitive = $derived(manifest && node ? getPrimitiveFromManifest(manifest, node.kind) : undefined);
	const component = $derived(manifest && node ? getComponentFromManifest(manifest, node.kind) : undefined);

	let inspectorTab = $state<"presets" | "props" | "output" | "contract" | "recipes">("props");

	$effect(() => {
		loadManifest().then((m) => { manifest = m; });
	});

	// Sync vpbVisual state when selected node changes
	$effect(() => {
		if (node) {
			vpbVisual.loadFromNode(node.kind, node.props ?? {});
		} else {
			vpbVisual.reset();
		}
	});

	function handleRecipeChange(e: Event) {
		if (!node) return;
		const recipeId = (e.target as HTMLSelectElement).value;
		vpbDocument.updateNodeRecipe(node.id, recipeId);
	}

	function handleDelete() {
		if (!node) return;
		vpbDocument.removeNode(node.id);
	}

	/** When a ColdLight prop changes, update both vpbVisual and vpbDocument */
	function handlePropChange(key: string, value: string) {
		vpbVisual.setProp(key, value);
		if (node) {
			vpbDocument.updateNodeProps(node.id, vpbVisual.toNodeProps());
		}
	}

	function formatKindName(kind: string): string {
		return kind
			.split("-")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");
	}
</script>

<div class="vpb-props">
	{#if node}
		<div class="vpb-props__header">
			<h3 class="vpb-props__kind">{formatKindName(node.kind)}</h3>
			<div class="vpb-props__meta">
				<span class="vpb-props__id">{node.id}</span>
				{#if vpbVisual.activePresetId}
					<span class="vpb-props__preset-badge">{vpbVisual.activePresetId}</span>
				{/if}
			</div>
		</div>

		<div class="vpb-props__section">
			<label class="vpb-props__label" for="vpb-recipe-select">Recipe</label>
			<select
				id="vpb-recipe-select"
				class="vpb-props__select"
				value={node.recipe}
				onchange={handleRecipeChange}
			>
				{#each recipes as recipe}
					<option value={recipe.id}>{recipe.label}</option>
				{/each}
			</select>
		</div>

		<div class="vpb-props__tabs">
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "presets"} onclick={() => (inspectorTab = "presets")}>Presets</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "props"} onclick={() => (inspectorTab = "props")}>Props</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "output"} onclick={() => (inspectorTab = "output")}>Output</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "contract"} onclick={() => (inspectorTab = "contract")}>Contract</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "recipes"} onclick={() => (inspectorTab = "recipes")}>Recipes</button>
		</div>

		{#if inspectorTab === "presets"}
			<div class="vpb-props__section">
				<VpbPresetPicker />
			</div>

		{:else if inspectorTab === "props"}
			<div class="vpb-props__section">
				<span class="vpb-props__label" id="vpb-surface-props-label">ColdLight 8-Axis</span>
				<PropControlFactory
					props={vpbVisual.props}
					resolvedPreset={vpbVisual.resolved.preset}
					onchange={handlePropChange}
				/>
			</div>

			<div class="vpb-props__section vpb-props__section--meta">
				<label class="vpb-props__label" for="vpb-meta-label">Label</label>
				<input
					id="vpb-meta-label"
					class="vpb-props__input"
					type="text"
					value={node.meta?.label ?? ""}
					oninput={(e) => {
						if (node) vpbDocument.updateNodeMeta(node.id, { label: (e.target as HTMLInputElement).value || undefined });
					}}
					placeholder="Optional label..."
				/>
			</div>

		{:else if inspectorTab === "output"}
			<div class="vpb-props__section">
				<VpbEncodingOutput resolved={vpbVisual.resolved} />
			</div>

		{:else if inspectorTab === "contract"}
			<VpbContractInspector {primitive} {component} />

		{:else if inspectorTab === "recipes"}
			<VpbRecipeLegend kind={node.kind} />
		{/if}

		<div class="vpb-props__actions">
			<button class="vpb-props__reset" onclick={() => { vpbVisual.reset(); if (node) vpbDocument.updateNodeProps(node.id, vpbVisual.toNodeProps()); }}>Reset Visual</button>
			<button class="vpb-props__delete" onclick={handleDelete}>Delete Block</button>
		</div>
	{:else}
		<div class="vpb-props__empty">
			<p>No block selected</p>
			<p class="vpb-props__empty-sub">Click a block in the canvas to inspect its properties</p>
		</div>
	{/if}
</div>

<style>
	.vpb-props {
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		height: 100%;
		overflow-y: auto;
	}
	.vpb-props__header {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-bottom: 8px;
		border-bottom: 1px solid oklch(1 0 0 / 0.06);
	}
	.vpb-props__kind {
		font-size: 15px;
		font-weight: 600;
		margin: 0;
		color: oklch(0.85 0.08 180);
	}
	.vpb-props__meta {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.vpb-props__id {
		font-size: 10px;
		color: oklch(0.5 0 0);
		font-family: monospace;
	}
	.vpb-props__preset-badge {
		font-size: 9px;
		font-family: monospace;
		padding: 1px 5px;
		border-radius: 3px;
		background: oklch(0.5 0.12 180 / 0.2);
		color: oklch(0.75 0.1 180);
		border: 1px solid oklch(0.5 0.12 180 / 0.3);
	}
	.vpb-props__section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.vpb-props__label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: oklch(0.55 0 0);
	}
	.vpb-props__select, .vpb-props__input {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid oklch(1 0 0 / 0.1);
		border-radius: 4px;
		background: oklch(1 0 0 / 0.04);
		color: inherit;
		font-size: 12px;
	}
	.vpb-props__select:focus, .vpb-props__input:focus {
		border-color: oklch(0.6 0.15 180);
		outline: none;
	}
	.vpb-props__actions {
		margin-top: auto;
		padding-top: 12px;
		border-top: 1px solid oklch(1 0 0 / 0.06);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.vpb-props__reset {
		width: 100%;
		padding: 6px;
		border: 1px solid oklch(0.5 0.1 180 / 0.3);
		border-radius: 4px;
		background: oklch(0.5 0.1 180 / 0.1);
		color: oklch(0.7 0.08 180);
		font-size: 12px;
		cursor: pointer;
	}
	.vpb-props__reset:hover {
		background: oklch(0.5 0.1 180 / 0.2);
	}
	.vpb-props__delete {
		width: 100%;
		padding: 6px;
		border: 1px solid oklch(0.5 0.15 20 / 0.3);
		border-radius: 4px;
		background: oklch(0.5 0.15 20 / 0.1);
		color: oklch(0.75 0.12 20);
		font-size: 12px;
		cursor: pointer;
	}
	.vpb-props__delete:hover {
		background: oklch(0.5 0.15 20 / 0.2);
	}
	.vpb-props__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 6px;
		color: oklch(0.5 0 0);
		text-align: center;
	}
	.vpb-props__empty-sub {
		font-size: 12px;
		color: oklch(0.4 0 0);
	}
	.vpb-props__tabs {
		display: flex;
		gap: 2px;
		padding: 2px;
		background: oklch(1 0 0 / 0.03);
		border-radius: 5px;
	}
	.vpb-props__tab {
		flex: 1;
		padding: 4px 4px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: oklch(0.5 0 0);
		font-size: 10px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.vpb-props__tab:hover {
		background: oklch(1 0 0 / 0.06);
	}
	.vpb-props__tab--active {
		background: oklch(0.5 0.12 180 / 0.2);
		color: oklch(0.8 0.08 180);
	}
</style>

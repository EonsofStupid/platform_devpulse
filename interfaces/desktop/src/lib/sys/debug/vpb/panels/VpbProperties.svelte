<!--
	@file VPB Properties — Node Inspector Panel
	@layer vpb

	Right panel: shows selected node's ColdLight visual controls.
	Five tabs: Presets, Props (8-axis controls), Output (encoding/CSS), Contract, Recipes.

	Uses vpbVisual state bridge for live resolveVisual() integration.
-->
<script lang="ts">
import { getRecipesForKind } from "$lib/design/recipes/index.js";
import PropControlFactory from "../controls/PropControlFactory.svelte";
import VpbEncodingOutput from "../controls/VpbEncodingOutput.svelte";
import VpbPresetPicker from "../controls/VpbPresetPicker.svelte";
import {
	getComponentFromManifest,
	getPrimitiveFromManifest,
	loadManifest,
	type UnifiedManifest,
} from "../manifest/manifest-reader.js";
import { vpbDocument } from "../state/vpb-document.svelte.js";
import { vpbVisual } from "../state/vpb-visual.svelte.js";
import VpbContractInspector from "./VpbContractInspector.svelte";
import VpbRecipeLegend from "./VpbRecipeLegend.svelte";

const node = $derived(vpbDocument.selectedNode);
const recipes = $derived(node ? getRecipesForKind(node.kind) : []);

let manifest = $state<UnifiedManifest | null>(null);
const primitive = $derived(
	manifest && node ? getPrimitiveFromManifest(manifest, node.kind) : undefined,
);
const component = $derived(
	manifest && node ? getComponentFromManifest(manifest, node.kind) : undefined,
);

let inspectorTab = $state<
	"presets" | "props" | "output" | "contract" | "recipes" | "accessibility" | "seo" | "style"
>("props");

$effect(() => {
	loadManifest().then((m) => {
		manifest = m;
	});
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
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "accessibility"} onclick={() => (inspectorTab = "accessibility")}>A11y</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "seo"} onclick={() => (inspectorTab = "seo")}>SEO</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "style"} onclick={() => (inspectorTab = "style")}>Style</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "presets"} onclick={() => (inspectorTab = "presets")}>Presets</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "props"} onclick={() => (inspectorTab = "props")}>Props</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "output"} onclick={() => (inspectorTab = "output")}>Output</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "contract"} onclick={() => (inspectorTab = "contract")}>Contract</button>
			<button class="vpb-props__tab" class:vpb-props__tab--active={inspectorTab === "recipes"} onclick={() => (inspectorTab = "recipes")}>Recipes</button>
		</div>

		{#if inspectorTab === "accessibility"}
			<div class="vpb-props__section">
				{#if component}
					<span class="vpb-props__label">ARIA Role</span>
					<div class="vpb-props__value">{primitive?.aria?.role ?? "none"}</div>

					<span class="vpb-props__label">Focus Strategy</span>
					<div class="vpb-props__value">{component.focus?.strategy ?? "none"}</div>

					<span class="vpb-props__label">Keyboard</span>
					{#if component.keyboard?.length}
						<div class="vpb-props__list">
							{#each component.keyboard as kb}
								<div class="vpb-props__list-item">
									<kbd class="vpb-props__kbd">{kb.key}</kbd>
									<span class="vpb-props__desc">{kb.description}</span>
								</div>
							{/each}
						</div>
					{:else}
						<div class="vpb-props__value vpb-props__value--muted">No keyboard interactions</div>
					{/if}

					<span class="vpb-props__label">Accessible Name</span>
					<div class="vpb-props__value">
						{component.accessibleName?.required ? "Required" : "Optional"}
						{#if component.accessibleName?.sources?.length}
							— via {component.accessibleName.sources.join(", ")}
						{/if}
					</div>

					<span class="vpb-props__label">States</span>
					{#if component.states?.length}
						<div class="vpb-props__tags">
							{#each component.states as state}
								<span class="vpb-props__tag">{state}</span>
							{/each}
						</div>
					{:else}
						<div class="vpb-props__value vpb-props__value--muted">No states</div>
					{/if}

					<span class="vpb-props__label">Interactions</span>
					<div class="vpb-props__tags">
						{#if component.interactions?.modal}<span class="vpb-props__tag vpb-props__tag--active">Modal</span>{/if}
						{#if component.interactions?.selectable}<span class="vpb-props__tag vpb-props__tag--active">Selectable</span>{/if}
						{#if component.interactions?.editable}<span class="vpb-props__tag vpb-props__tag--active">Editable</span>{/if}
						{#if component.interactions?.expandable}<span class="vpb-props__tag vpb-props__tag--active">Expandable</span>{/if}
					</div>

					{#if primitive?.slots}
						<span class="vpb-props__label">Slots</span>
						<div class="vpb-props__list">
							{#each primitive.slots.required as slot}
								<div class="vpb-props__list-item">
									<span class="vpb-props__slot-name">{slot}</span>
									<span class="vpb-props__slot-badge vpb-props__slot-badge--required">required</span>
									{#if primitive.slotSpec?.[slot]?.aria?.role}
										<span class="vpb-props__slot-role">role="{primitive.slotSpec[slot].aria.role}"</span>
									{/if}
								</div>
							{/each}
							{#each primitive.slots.optional as slot}
								<div class="vpb-props__list-item">
									<span class="vpb-props__slot-name">{slot}</span>
									<span class="vpb-props__slot-badge">optional</span>
									{#if primitive.slotSpec?.[slot]?.aria?.role}
										<span class="vpb-props__slot-role">role="{primitive.slotSpec[slot].aria.role}"</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="vpb-props__value vpb-props__value--muted">No component contract found for "{node.kind}"</div>
				{/if}
			</div>

		{:else if inspectorTab === "seo"}
			<div class="vpb-props__section">
				{#if primitive}
					<span class="vpb-props__label">Semantic Element</span>
					<div class="vpb-props__value">&lt;{primitive.slotSpec?.root?.element ?? "div"}&gt;</div>

					<span class="vpb-props__label">ARIA Landmark</span>
					<div class="vpb-props__value">{primitive.aria?.role ?? "none"}</div>

					{#if component?.apgPattern}
						<span class="vpb-props__label">WAI-ARIA Pattern</span>
						<a class="vpb-props__link" href={component.apgPattern} target="_blank" rel="noopener">{component.apgPattern}</a>
					{/if}

					<span class="vpb-props__label">Compound</span>
					<div class="vpb-props__value">{primitive.compound ? "Yes — uses context coordination" : "No — standalone"}</div>

					{#if primitive.orientation}
						<span class="vpb-props__label">Orientation</span>
						<div class="vpb-props__value">{primitive.orientation}</div>
					{/if}

					{#if component?.waiAdapt}
						<span class="vpb-props__label">WAI-Adapt</span>
						<div class="vpb-props__value">
							{#if component.waiAdapt.action}Action: {component.waiAdapt.action}{/if}
							{#if component.waiAdapt.purpose}Purpose: {component.waiAdapt.purpose}{/if}
						</div>
					{/if}

					<span class="vpb-props__label">Required ARIA Attributes</span>
					{#if primitive.aria?.requiredAttrs?.length}
						<div class="vpb-props__tags">
							{#each primitive.aria.requiredAttrs as attr}
								<span class="vpb-props__tag">{attr}</span>
							{/each}
						</div>
					{:else}
						<div class="vpb-props__value vpb-props__value--muted">None required</div>
					{/if}
				{:else}
					<div class="vpb-props__value vpb-props__value--muted">No primitive contract found</div>
				{/if}
			</div>

		{:else if inspectorTab === "style"}
			<div class="vpb-props__section">
				<span class="vpb-props__label">Available Recipes</span>
				{#if recipes.length}
					<div class="vpb-props__list">
						{#each recipes as recipe}
							<div class="vpb-props__list-item">
								<span class="vpb-props__slot-name">{recipe.id}</span>
								<span class="vpb-props__desc">{recipe.label}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="vpb-props__value vpb-props__value--muted">No recipes registered for {node.kind}</div>
				{/if}

				<span class="vpb-props__label">ColdLight Encoding</span>
				<div class="vpb-props__value">8-axis: surface, material, depth, bevel, glow, frame, motion, transition</div>

				{#if vpbVisual.resolved}
					<span class="vpb-props__label">Active Visual</span>
					<div class="vpb-props__code">
						{#if vpbVisual.resolved.encoding}
							<span>Encoding: {vpbVisual.resolved.encoding}</span>
						{/if}
						{#if vpbVisual.resolved.segments}
							<span>Segments: {vpbVisual.resolved.segments}</span>
						{/if}
					</div>
				{/if}

				{#if primitive?.slotSpec}
					<span class="vpb-props__label">Slot CSS Targets</span>
					<div class="vpb-props__list">
						{#each Object.entries(primitive.slotSpec) as [slot, spec]}
							<div class="vpb-props__list-item">
								<span class="vpb-props__slot-name">[data-cl-{node.kind}-{slot}]</span>
								<span class="vpb-props__desc">&lt;{spec.element}&gt;</span>
							</div>
						{/each}
					</div>
				{/if}

				{#if vpbVisual.activePresetId}
					<span class="vpb-props__label">Active Preset</span>
					<div class="vpb-props__value">{vpbVisual.activePresetId}</div>
				{/if}
			</div>

		{:else if inspectorTab === "presets"}
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
		border-bottom: 1px solid var(--vpb-border);
	}
	.vpb-props__kind {
		font-size: 15px;
		font-weight: 600;
		margin: 0;
		color: var(--vpb-graph-node-kind-color);
	}
	.vpb-props__meta {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.vpb-props__id {
		font-size: 10px;
		color: var(--vpb-label-dim);
		font-family: monospace;
	}
	.vpb-props__preset-badge {
		font-size: 9px;
		font-family: monospace;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--vpb-tag-teal-bg);
		color: var(--vpb-tag-teal-color);
		border: 1px solid var(--vpb-tag-teal-border);
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
		color: var(--vpb-label-color);
	}
	.vpb-props__select, .vpb-props__input {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid var(--vpb-btn-border);
		border-radius: 4px;
		background: var(--vpb-btn-bg);
		color: inherit;
		font-size: 12px;
	}
	.vpb-props__select:focus, .vpb-props__input:focus {
		border-color: var(--vpb-accent-teal);
		outline: none;
	}
	.vpb-props__actions {
		margin-top: auto;
		padding-top: 12px;
		border-top: 1px solid var(--vpb-border);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.vpb-props__reset {
		width: 100%;
		padding: 6px;
		border: 1px solid var(--vpb-tag-teal-border);
		border-radius: 4px;
		background: var(--vpb-tag-teal-bg);
		color: var(--vpb-tag-teal-color);
		font-size: 12px;
		cursor: pointer;
	}
	.vpb-props__reset:hover {
		background: var(--vpb-tag-teal-bg);
	}
	.vpb-props__delete {
		width: 100%;
		padding: 6px;
		border: 1px solid var(--vpb-tag-ember-border);
		border-radius: 4px;
		background: var(--vpb-tag-ember-bg);
		color: var(--vpb-tag-ember-color);
		font-size: 12px;
		cursor: pointer;
	}
	.vpb-props__delete:hover {
		background: var(--vpb-tag-ember-bg);
	}
	.vpb-props__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 6px;
		color: var(--vpb-label-dim);
		text-align: center;
	}
	.vpb-props__empty-sub {
		font-size: 12px;
		color: var(--vpb-text-dim);
	}
	.vpb-props__tabs {
		display: flex;
		gap: 2px;
		padding: 2px;
		background: var(--vpb-btn-bg);
		border-radius: 5px;
	}
	.vpb-props__tab {
		flex: 1;
		padding: 4px 4px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--vpb-label-dim);
		font-size: 10px;
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}
	.vpb-props__tab:hover {
		background: var(--vpb-border);
	}
	.vpb-props__tab--active {
		background: var(--vpb-tag-teal-bg);
		color: var(--vpb-btn-active-color);
	}
	.vpb-props__value {
		font-size: 12px;
		color: var(--vpb-text-bright);
		padding: 2px 0;
	}
	.vpb-props__value--muted {
		color: var(--vpb-label-dim);
		font-style: italic;
	}
	.vpb-props__list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.vpb-props__list-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 6px;
		border-radius: 3px;
		background: var(--vpb-btn-bg);
		font-size: 11px;
	}
	.vpb-props__kbd {
		display: inline-block;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--vpb-btn-hover);
		border: 1px solid var(--vpb-code-border);
		font-family: monospace;
		font-size: 10px;
		color: var(--vpb-btn-active-color);
		min-width: 24px;
		text-align: center;
	}
	.vpb-props__desc {
		font-size: 11px;
		color: var(--vpb-label-color);
	}
	.vpb-props__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.vpb-props__tag {
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--vpb-border);
		border: 1px solid var(--vpb-btn-hover);
		font-size: 10px;
		font-family: monospace;
		color: var(--vpb-value-color);
	}
	.vpb-props__tag--active {
		background: var(--vpb-tag-green-bg);
		border-color: var(--vpb-tag-green-border);
		color: var(--vpb-tag-green-color);
	}
	.vpb-props__slot-name {
		font-family: monospace;
		font-size: 11px;
		color: var(--vpb-btn-active-color);
	}
	.vpb-props__slot-badge {
		font-size: 9px;
		padding: 0 4px;
		border-radius: 2px;
		background: var(--vpb-border);
		color: var(--vpb-label-dim);
	}
	.vpb-props__slot-badge--required {
		background: var(--vpb-tag-ember-bg);
		color: var(--vpb-tag-ember-color);
	}
	.vpb-props__slot-role {
		font-family: monospace;
		font-size: 10px;
		color: var(--vpb-encoding-purple);
	}
	.vpb-props__link {
		font-size: 11px;
		color: var(--vpb-tag-teal-color);
		text-decoration: underline;
		word-break: break-all;
	}
	.vpb-props__code {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 6px 8px;
		border-radius: 4px;
		background: var(--vpb-btn-bg);
		border: 1px solid var(--vpb-btn-hover);
		font-family: monospace;
		font-size: 10px;
		color: var(--vpb-value-color);
	}
</style>

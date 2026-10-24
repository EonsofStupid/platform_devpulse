<!--
	@file VpbPresetPicker — Named Preset Selector
	@layer vpb

	Shows ColdLight's preset library (every preset fits every kind).
	Clicking a preset applies it via vpbVisual.applyPreset().
-->
<script lang="ts">
import { vpbDocument } from "../state/vpb-document.svelte.js";
import { type LibraryPreset, vpbVisual } from "../state/vpb-visual.svelte.js";

const presets = $derived(vpbVisual.availablePresets);

/** Apply a preset to the editor and to the selected node, so canvas and save follow. */
function applyPreset(presetId: string): void {
	vpbVisual.applyPreset(presetId);
	const node = vpbDocument.selectedNode;
	if (node) vpbDocument.updateNodeProps(node.id, vpbVisual.toNodeProps());
}

function formatEncoding(preset: LibraryPreset): string {
	return `${preset.family} · ${preset.variant}`;
}
</script>

<div class="vpb-presets">
	{#if presets.length === 0}
		<p class="vpb-presets__empty">The preset library is empty</p>
	{:else}
		{#each presets as preset (preset.id)}
			<button
				class="vpb-presets__item"
				class:vpb-presets__item--active={vpbVisual.activePresetId === preset.id}
				onclick={() => applyPreset(preset.id)}
				title={preset.description ?? preset.label}
			>
				<span class="vpb-presets__label">{preset.label}</span>
				<span class="vpb-presets__id">{preset.id}</span>
				<span class="vpb-presets__encoding">{formatEncoding(preset)}</span>
			</button>
		{/each}
	{/if}
</div>

<style>
	.vpb-presets {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.vpb-presets__empty {
		font-size: 11px;
		color: var(--vpb-label-dim);
		text-align: center;
		padding: 8px;
	}
	.vpb-presets__item {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 6px 8px;
		border: 1px solid var(--vpb-border);
		border-radius: 4px;
		background: var(--vpb-btn-bg);
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s;
	}
	.vpb-presets__item:hover {
		background: var(--vpb-border);
		border-color: var(--vpb-btn-border);
	}
	.vpb-presets__item--active {
		background: var(--vpb-btn-active-bg);
		border-color: var(--vpb-btn-active-border);
	}
	.vpb-presets__label {
		font-size: 12px;
		font-weight: 600;
	}
	.vpb-presets__id {
		font-size: 10px;
		font-family: monospace;
		color: var(--vpb-accent-teal);
	}
	.vpb-presets__encoding {
		font-size: 9px;
		font-family: monospace;
		color: var(--vpb-label-dim);
	}
</style>

<!--
	@file VpbPresetPicker — Named Preset Selector
	@layer vpb

	Shows all registered presets for the selected component's kind.
	Clicking a preset applies it via vpbVisual.applyPreset().
-->
<script lang="ts">
	import { vpbVisual } from "../state/vpb-visual.svelte.js";
	import type { PresetDefinition } from "$lib/design/registry/presets.js";
	import { resolveVisual } from "$lib/design/registry/resolve-visual.js";

	const presets = $derived(vpbVisual.availablePresets);

	function formatEncoding(preset: PresetDefinition): string {
		const resolved = resolveVisual({ preset: preset.id });
		return resolved.encoding || "defaults";
	}
</script>

<div class="vpb-presets">
	{#if presets.length === 0}
		<p class="vpb-presets__empty">No presets for this kind</p>
	{:else}
		{#each presets as preset}
			<button
				class="vpb-presets__item"
				class:vpb-presets__item--active={vpbVisual.activePresetId === preset.id}
				onclick={() => vpbVisual.applyPreset(preset.id)}
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

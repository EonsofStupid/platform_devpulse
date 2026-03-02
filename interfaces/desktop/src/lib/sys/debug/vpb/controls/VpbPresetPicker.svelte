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
		color: oklch(0.45 0 0);
		text-align: center;
		padding: 8px;
	}
	.vpb-presets__item {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: 6px 8px;
		border: 1px solid oklch(1 0 0 / 0.06);
		border-radius: 4px;
		background: oklch(1 0 0 / 0.02);
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition: background 0.12s, border-color 0.12s;
	}
	.vpb-presets__item:hover {
		background: oklch(1 0 0 / 0.06);
		border-color: oklch(1 0 0 / 0.1);
	}
	.vpb-presets__item--active {
		background: oklch(0.5 0.15 180 / 0.15);
		border-color: oklch(0.6 0.15 180 / 0.35);
	}
	.vpb-presets__label {
		font-size: 12px;
		font-weight: 600;
	}
	.vpb-presets__id {
		font-size: 10px;
		font-family: monospace;
		color: oklch(0.6 0.08 180);
	}
	.vpb-presets__encoding {
		font-size: 9px;
		font-family: monospace;
		color: oklch(0.5 0 0);
	}
</style>

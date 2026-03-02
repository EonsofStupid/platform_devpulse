<!--
	@file PropControlFactory — Maps ColdLight 8-axis props to controls
	@layer vpb

	Entry point for the properties panel. Renders the correct control
	for each category using SEMANTIC IDs from the resolved visual.

	Uses TOKEN_CATEGORY_REGISTRY to generate controls for the 8 Preset
	categories (surface, material, depth, bevel, glow, frame, motion, transition),
	plus Size and Radius structural props.

	Emits semantic field names ("surface", "glass-deep") NOT numeric codes ("s", 2).
-->
<script lang="ts">
	import {
		TOKEN_CATEGORY_REGISTRY,
		CODE_TO_NAME,
		type Preset,
	} from "$lib/design/registry/token-categories.js";
	import type { ColdLightProps } from "$lib/design/registry/resolve-visual.js";
	import SizeControl from "./SizeControl.svelte";
	import RadiusControl from "./RadiusControl.svelte";

	let {
		props,
		resolvedPreset,
		onchange,
	}: {
		/** Current ColdLight props being edited */
		props: ColdLightProps;
		/** Resolved preset from resolveVisual() — shows what's actually active */
		resolvedPreset: Preset;
		/** Callback: emits (fieldName, semanticId) e.g. ("surface", "glass-deep") */
		onchange: (key: string, value: string) => void;
	} = $props();

	/** Sorted by encodingOrder so controls appear in a consistent order. */
	const categories = TOKEN_CATEGORY_REGISTRY.toSorted(
		(a, b) => a.encodingOrder - b.encodingOrder,
	);

	/** Get the current semantic ID for a category from the resolved preset. */
	function getCurrentId(code: string): string {
		const name = CODE_TO_NAME[code] as keyof Preset;
		return resolvedPreset[name];
	}
</script>

<div class="vpb-controls">
	{#each categories as cat}
		{@const name = CODE_TO_NAME[cat.code]}
		{@const currentId = getCurrentId(cat.code)}
		{@const currentValue = cat.values.find((v) => v.id === currentId)}

		{#if cat.vpbControl === "slider"}
			{@const currentIndex = currentValue?.index ?? cat.defaultIndex}
			<div class="vpb-ctrl">
				<span class="vpb-ctrl__label">
					{cat.name}
					<span class="vpb-ctrl__val">{currentValue?.label ?? currentId}</span>
				</span>
				<input
					class="vpb-ctrl__slider"
					type="range"
					min={0}
					max={cat.values.length - 1}
					step="1"
					value={currentIndex}
					oninput={(e) => {
						const idx = Number((e.target as HTMLInputElement).value);
						const v = cat.values[idx];
						if (v && name) onchange(name, v.id);
					}}
				/>
				<div class="vpb-ctrl__ticks">
					{#each cat.values as v}
						<span
							class="vpb-ctrl__tick"
							class:vpb-ctrl__tick--active={v.id === currentId}
						>
							{v.label.split(" ")[0]}
						</span>
					{/each}
				</div>
			</div>
		{:else}
			<div class="vpb-ctrl">
				<span class="vpb-ctrl__label">{cat.name}</span>
				<div class="vpb-ctrl__seg">
					{#each cat.values as v}
						<button
							class="vpb-ctrl__seg-btn"
							class:vpb-ctrl__seg-btn--active={v.id === currentId}
							onclick={() => { if (name) onchange(name, v.id); }}
							title="{v.label} ({v.id})"
						>{v.label}</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}

	<!-- Structural props (string tokens, not encoding categories) -->
	<SizeControl value={props.size ?? "md"} onchange={(v) => onchange("size", v)} />
	<RadiusControl value={props.radius ?? "md"} onchange={(v) => onchange("radius", v)} />
</div>

<style>
	.vpb-controls {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.55 0 0); display: flex; justify-content: space-between; }
	.vpb-ctrl__val { color: oklch(0.7 0.1 180); font-weight: 400; text-transform: none; }
	.vpb-ctrl__slider { width: 100%; accent-color: oklch(0.6 0.15 180); }
	.vpb-ctrl__ticks { display: flex; justify-content: space-between; }
	.vpb-ctrl__tick { font-size: 9px; color: oklch(0.45 0 0); }
	.vpb-ctrl__tick--active { color: oklch(0.7 0.1 180); font-weight: 600; }
	.vpb-ctrl__seg { display: flex; gap: 2px; flex-wrap: wrap; }
	.vpb-ctrl__seg-btn { flex: 1; padding: 4px 6px; border: 1px solid oklch(1 0 0 / 0.1); border-radius: 3px; background: oklch(1 0 0 / 0.04); color: inherit; font-size: 10px; cursor: pointer; white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
	.vpb-ctrl__seg-btn:hover { background: oklch(1 0 0 / 0.08); }
	.vpb-ctrl__seg-btn--active { background: oklch(0.5 0.15 180 / 0.2); border-color: oklch(0.6 0.15 180 / 0.4); color: oklch(0.8 0.1 180); }
</style>

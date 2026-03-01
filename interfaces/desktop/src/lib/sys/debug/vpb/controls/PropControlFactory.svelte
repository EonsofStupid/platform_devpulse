<!--
	@file PropControlFactory — Maps DsSurfaceProps fields to controls
	@layer vpb

	Entry point for the properties panel. Renders the correct control
	for each DsSurfaceProps field.

	Uses TOKEN_CATEGORY_REGISTRY to generate controls for the 8 Preset
	category indices (s, z, d, b, g, f, m, t), plus Size and Radius.
-->
<script lang="ts">
	import type { DsSurfaceProps } from "$lib/design/recipes/types.js";
	import { TOKEN_CATEGORY_REGISTRY } from "$lib/design/registry/token-categories.js";
	import SizeControl from "./SizeControl.svelte";
	import RadiusControl from "./RadiusControl.svelte";

	let {
		props,
		onchange,
	}: {
		props: Partial<DsSurfaceProps>;
		onchange: (key: string, value: unknown) => void;
	} = $props();

	/** Sorted by encodingOrder so controls appear in a consistent order. */
	const categories = TOKEN_CATEGORY_REGISTRY.toSorted(
		(a, b) => a.encodingOrder - b.encodingOrder,
	);
</script>

<div class="vpb-controls">
	{#each categories as cat}
		{@const code = cat.code as keyof DsSurfaceProps}
		{@const current = (props[code] as number | undefined) ?? cat.defaultIndex}

		{#if cat.vpbControl === "slider"}
			<div class="vpb-ctrl">
				<span class="vpb-ctrl__label">
					{cat.name}
					<span class="vpb-ctrl__val">{cat.values[current]?.label ?? current}</span>
				</span>
				<input
					class="vpb-ctrl__slider"
					type="range"
					min={0}
					max={cat.values.length - 1}
					step="1"
					value={current}
					oninput={(e) => onchange(cat.code, Number((e.target as HTMLInputElement).value))}
				/>
				<div class="vpb-ctrl__ticks">
					{#each cat.values as v}
						<span class="vpb-ctrl__tick" class:vpb-ctrl__tick--active={current === v.index}>
							{v.index}
						</span>
					{/each}
				</div>
			</div>
		{:else}
			<!-- select / toggle / color-picker / curve-editor all render as select for now -->
			<div class="vpb-ctrl">
				<span class="vpb-ctrl__label">{cat.name}</span>
				<div class="vpb-ctrl__seg">
					{#each cat.values as v}
						<button
							class="vpb-ctrl__seg-btn"
							class:vpb-ctrl__seg-btn--active={current === v.index}
							onclick={() => onchange(cat.code, v.index)}
							title={v.label}
						>{v.label}</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}

	<!-- Structural props (string tokens, not category indices) -->
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

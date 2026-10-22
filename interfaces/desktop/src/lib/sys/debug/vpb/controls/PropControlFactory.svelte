<!--
	@file PropControlFactory — Maps ColdLight's eight visual axis props to controls
	@layer vpb

	Entry point for the properties panel. Renders one control per axis of
	the VPB axis registry (surface, depth, bevel, glow, frame, radius,
	motion, transition), with option ids read from ColdLight's token
	manifest. Surface, bevel, glow and radius use their own controls; the
	rest use the generic slider or segmented control their axis names.

	Emits axis names + option ids ("surface", "glass-deep").
-->
<script lang="ts">
import { type AxisContext, VPB_AXES, type VpbProps } from "../registry/vpb-axes.js";
import BevelControl from "./BevelControl.svelte";
import GlowControl from "./GlowControl.svelte";
import RadiusControl from "./RadiusControl.svelte";
import SurfaceControl from "./SurfaceControl.svelte";

let {
	props,
	context,
	onchange,
}: {
	/** Current visual props being edited */
	props: VpbProps;
	/** Axis options from the token manifest */
	context: AxisContext;
	/** Callback: emits (axis, option id) e.g. ("surface", "glass-deep") */
	onchange: (key: string, value: string) => void;
} = $props();
</script>

<div class="vpb-controls">
	{#each VPB_AXES as axis (axis.key)}
		{@const options = context.options[axis.key]}
		{@const ids = options.map((o) => o.id)}
		{@const currentId = props[axis.key] ?? ""}

		{#if axis.key === "surface"}
			<SurfaceControl value={currentId} options={ids} onchange={(v) => onchange(axis.key, v)} />
		{:else if axis.key === "bevel"}
			<BevelControl value={currentId} options={ids} onchange={(v) => onchange(axis.key, v)} />
		{:else if axis.key === "glow"}
			<GlowControl value={currentId} {options} onchange={(v) => onchange(axis.key, v)} />
		{:else if axis.key === "radius"}
			<RadiusControl value={currentId} options={ids} onchange={(v) => onchange(axis.key, v)} />
		{:else if axis.control === "slider" && ids.length > 0}
			{@const currentIndex = Math.max(0, ids.indexOf(currentId))}
			<div class="vpb-ctrl">
				<span class="vpb-ctrl__label">
					{axis.label}
					<span class="vpb-ctrl__val">{currentId || "default"}</span>
				</span>
				<input
					class="vpb-ctrl__slider"
					type="range"
					min={0}
					max={ids.length - 1}
					step="1"
					value={currentIndex}
					aria-label={axis.label}
					oninput={(e) => {
						const id = ids[Number((e.target as HTMLInputElement).value)];
						if (id) onchange(axis.key, id);
					}}
				/>
				<div class="vpb-ctrl__ticks">
					{#each ids as id (id)}
						<span class="vpb-ctrl__tick" class:vpb-ctrl__tick--active={id === currentId}>{id}</span>
					{/each}
				</div>
			</div>
		{:else}
			<div class="vpb-ctrl">
				<span class="vpb-ctrl__label">{axis.label}</span>
				<div class="vpb-ctrl__seg">
					{#each ids as id (id)}
						<button
							class="vpb-ctrl__seg-btn"
							class:vpb-ctrl__seg-btn--active={id === currentId}
							onclick={() => onchange(axis.key, id)}
							title={id}
						>{id}</button>
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>

<style>
	.vpb-controls {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vpb-label-color); display: flex; justify-content: space-between; }
	.vpb-ctrl__val { color: var(--vpb-tick-active); font-weight: 400; text-transform: none; }
	.vpb-ctrl__slider { width: 100%; accent-color: var(--vpb-slider-accent); }
	.vpb-ctrl__ticks { display: flex; justify-content: space-between; }
	.vpb-ctrl__tick { font-size: 9px; color: var(--vpb-label-dim); }
	.vpb-ctrl__tick--active { color: var(--vpb-tick-active); font-weight: 600; }
	.vpb-ctrl__seg { display: flex; gap: 2px; flex-wrap: wrap; }
	.vpb-ctrl__seg-btn { flex: 1 0 auto; padding: 4px 6px; border: 1px solid var(--vpb-btn-border); border-radius: 3px; background: var(--vpb-btn-bg); color: inherit; font-size: 10px; cursor: pointer; white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
	.vpb-ctrl__seg-btn:hover { background: var(--vpb-btn-hover); }
	.vpb-ctrl__seg-btn--active { background: var(--vpb-btn-active-bg); border-color: var(--vpb-btn-active-border); color: var(--vpb-btn-active-color); }
</style>

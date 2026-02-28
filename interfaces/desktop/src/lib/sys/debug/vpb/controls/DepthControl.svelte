<!--
	@file DepthControl — Elevation slider 0-4
	@layer vpb
-->
<script lang="ts">
	import { DepthTokens } from "$lib/design/tokens/types.js";

	let { value, onchange }: { value: number; onchange: (v: number) => void } = $props();
</script>

<div class="vpb-ctrl">
	<span class="vpb-ctrl__label">Depth <span class="vpb-ctrl__val">e-{value}</span></span>
	<input
		class="vpb-ctrl__slider"
		type="range"
		min={DepthTokens[0]}
		max={DepthTokens[DepthTokens.length - 1]}
		step="1"
		{value}
		oninput={(e) => onchange(Number((e.target as HTMLInputElement).value))}
	/>
	<div class="vpb-ctrl__ticks">
		{#each DepthTokens as d}
			<span class="vpb-ctrl__tick" class:vpb-ctrl__tick--active={value === d}>{d}</span>
		{/each}
	</div>
</div>

<style>
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.55 0 0); display: flex; justify-content: space-between; }
	.vpb-ctrl__val { color: oklch(0.7 0.1 180); font-weight: 400; }
	.vpb-ctrl__slider { width: 100%; accent-color: oklch(0.6 0.15 180); }
	.vpb-ctrl__ticks { display: flex; justify-content: space-between; }
	.vpb-ctrl__tick { font-size: 9px; color: oklch(0.45 0 0); }
	.vpb-ctrl__tick--active { color: oklch(0.7 0.1 180); font-weight: 600; }
</style>

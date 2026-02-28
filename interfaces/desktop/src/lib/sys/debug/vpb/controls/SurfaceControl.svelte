<!--
	@file SurfaceControl — glass / solid / matte
	@layer vpb
-->
<script lang="ts">
	import { SurfaceTokens } from "$lib/design/tokens/types.js";

	let { value, onchange }: { value: string; onchange: (v: string) => void } = $props();
</script>

<div class="vpb-ctrl">
	<span class="vpb-ctrl__label">Surface</span>
	<div class="vpb-ctrl__seg">
		{#each SurfaceTokens as token}
			<button
				class="vpb-ctrl__seg-btn"
				class:vpb-ctrl__seg-btn--active={value === token}
				onclick={() => onchange(token)}
			>{token}</button>
		{/each}
	</div>
</div>

<style>
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.55 0 0); }
	.vpb-ctrl__seg { display: flex; gap: 2px; }
	.vpb-ctrl__seg-btn { flex: 1; padding: 4px 6px; border: 1px solid oklch(1 0 0 / 0.1); border-radius: 3px; background: oklch(1 0 0 / 0.04); color: inherit; font-size: 11px; cursor: pointer; text-transform: capitalize; }
	.vpb-ctrl__seg-btn:hover { background: oklch(1 0 0 / 0.08); }
	.vpb-ctrl__seg-btn--active { background: oklch(0.5 0.15 180 / 0.2); border-color: oklch(0.6 0.15 180 / 0.4); color: oklch(0.8 0.1 180); }
</style>

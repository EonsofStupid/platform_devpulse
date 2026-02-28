<!--
	@file GlowControl — Glow color picker with "off" option
	@layer vpb
-->
<script lang="ts">
	import { GlowTokens } from "$lib/design/tokens/types.js";

	let { value, onchange }: { value: string; onchange: (v: string) => void } = $props();

	const GLOW_COLORS: Record<string, string> = {
		off: "oklch(0.3 0 0)",
		teal: "oklch(0.6 0.15 180)",
		purple: "oklch(0.5 0.2 290)",
		magenta: "oklch(0.55 0.2 340)",
		ember: "oklch(0.6 0.2 40)",
		frost: "oklch(0.7 0.1 220)",
		cyber: "oklch(0.65 0.2 140)",
	};
</script>

<div class="vpb-ctrl">
	<span class="vpb-ctrl__label">Glow</span>
	<div class="vpb-ctrl__swatches">
		{#each GlowTokens as token}
			<button
				class="vpb-ctrl__swatch"
				class:vpb-ctrl__swatch--active={value === token}
				class:vpb-ctrl__swatch--off={token === "off"}
				style="--swatch-color: {GLOW_COLORS[token] ?? 'oklch(0.5 0 0)'}"
				onclick={() => onchange(token)}
				title={token}
			>
				{#if token === "off"}
					<span class="vpb-ctrl__swatch-x">&#x2715;</span>
				{:else}
					<span class="vpb-ctrl__swatch-dot"></span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.55 0 0); }
	.vpb-ctrl__swatches { display: flex; gap: 4px; flex-wrap: wrap; }
	.vpb-ctrl__swatch { width: 28px; height: 28px; border: 2px solid transparent; border-radius: 4px; background: oklch(1 0 0 / 0.04); cursor: pointer; display: flex; align-items: center; justify-content: center; }
	.vpb-ctrl__swatch:hover { border-color: oklch(1 0 0 / 0.15); }
	.vpb-ctrl__swatch--active { border-color: oklch(0.8 0 0); }
	.vpb-ctrl__swatch--off { opacity: 0.6; }
	.vpb-ctrl__swatch-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--swatch-color); }
	.vpb-ctrl__swatch-x { font-size: 10px; color: oklch(0.5 0 0); }
</style>

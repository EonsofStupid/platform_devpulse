<!--
	@file AccentControl — Color swatch picker
	@layer vpb
-->
<script lang="ts">
	import { AccentTokens } from "$lib/design/tokens/types.js";

	let { value, onchange }: { value: string; onchange: (v: string) => void } = $props();

	const ACCENT_COLORS: Record<string, string> = {
		teal: "oklch(0.6 0.15 180)",
		purple: "oklch(0.5 0.2 290)",
		magenta: "oklch(0.55 0.2 340)",
		ember: "oklch(0.6 0.2 40)",
		frost: "oklch(0.7 0.1 220)",
	};
</script>

<div class="vpb-ctrl">
	<span class="vpb-ctrl__label">Accent</span>
	<div class="vpb-ctrl__swatches">
		{#each AccentTokens as token}
			<button
				class="vpb-ctrl__swatch"
				class:vpb-ctrl__swatch--active={value === token}
				style="--swatch-color: {ACCENT_COLORS[token] ?? 'oklch(0.5 0 0)'}"
				onclick={() => onchange(token)}
				title={token}
			>
				<span class="vpb-ctrl__swatch-dot"></span>
			</button>
		{/each}
	</div>
</div>

<style>
	.vpb-ctrl { display: flex; flex-direction: column; gap: 4px; }
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.55 0 0); }
	.vpb-ctrl__swatches { display: flex; gap: 4px; }
	.vpb-ctrl__swatch { width: 32px; height: 28px; border: 2px solid transparent; border-radius: 4px; background: oklch(1 0 0 / 0.04); cursor: pointer; display: flex; align-items: center; justify-content: center; }
	.vpb-ctrl__swatch:hover { border-color: oklch(1 0 0 / 0.15); }
	.vpb-ctrl__swatch--active { border-color: oklch(0.8 0 0); }
	.vpb-ctrl__swatch-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--swatch-color); }
</style>

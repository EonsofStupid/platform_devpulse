<!--
	@file GlowControl — Glow color picker with "off" option
	@layer vpb
-->
<script lang="ts">
import type { AxisOption } from "../registry/vpb-axes.js";

let {
	value,
	options,
	onchange,
}: {
	value: string;
	/** Glow options from the token manifest; each token is a whole shadow. */
	options: readonly AxisOption[];
	onchange: (v: string) => void;
} = $props();
</script>

<div class="vpb-ctrl">
	<span class="vpb-ctrl__label">Glow</span>
	<div class="vpb-ctrl__swatches">
		{#each options as option (option.id)}
			{@const token = option.id}
			<button
				class="vpb-ctrl__swatch"
				class:vpb-ctrl__swatch--active={value === token}
				class:vpb-ctrl__swatch--off={token === "off"}
				style="--swatch-glow: var({option.cssVar})"
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
	.vpb-ctrl__label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--vpb-label-color); }
	.vpb-ctrl__swatches { display: flex; gap: 4px; flex-wrap: wrap; }
	.vpb-ctrl__swatch { width: 28px; height: 28px; border: 2px solid transparent; border-radius: 4px; background: var(--vpb-btn-bg); cursor: pointer; display: flex; align-items: center; justify-content: center; }
	.vpb-ctrl__swatch:hover { border-color: var(--vpb-swatch-hover-border); }
	.vpb-ctrl__swatch--active { border-color: var(--vpb-swatch-active-border); }
	.vpb-ctrl__swatch--off { opacity: 0.6; }
	.vpb-ctrl__swatch-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--vpb-text-bright); box-shadow: var(--swatch-glow); }
	.vpb-ctrl__swatch-x { font-size: 10px; color: var(--vpb-label-dim); }
</style>

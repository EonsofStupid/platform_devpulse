<!--
  @file VramBar.svelte
  Commandment #5: Always-visible GPU memory bar.
  Green = fits with headroom. Yellow = tight (>75%). Red = won't fit.
  Shows "GPU Memory: 5.2 / 10.0 GB used" format.
-->
<script lang="ts">
import { Monitor } from "lucide-svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";

/** Total VRAM allocated by assigned models (sum of estimates). */
const allocatedMb = $derived(
	modelsState.userSlots.reduce((sum, slot) => {
		if (!slot.assigned_model_id) return sum;
		const model = modelsState.models.find((m) => m.id === slot.assigned_model_id);
		return sum + (model?.vram_estimate_mb ?? 0);
	}, 0),
);

const totalMb = $derived(hardwareState.vramTotalMb ?? 0);
const pct = $derived(totalMb > 0 ? Math.min(100, (allocatedMb / totalMb) * 100) : 0);

/** Green < 75%, Yellow 75-90%, Red > 90%. */
const barColor = $derived(
	pct > 90 ? "var(--wiz-salmon)" : pct > 75 ? "var(--wiz-gold)" : "var(--wiz-green)",
);
const barGlow = $derived(
	pct > 90 ? "var(--wiz-glow-ember)" : pct > 75 ? "var(--wiz-fill-ember)" : "none",
);
</script>

{#if totalMb > 0}
	<div class="vram-bar-wrap">
		<div class="vram-label">
			<Monitor size={14} />
			<span>GPU Memory: <strong>{formatMb(allocatedMb)}</strong> / {formatMb(totalMb)} used</span>
		</div>
		<div class="vram-track">
			<div
				class="vram-fill"
				style="width: {pct}%; background: {barColor}; box-shadow: {barGlow};"
			></div>
		</div>
		{#if pct > 90}
			<span class="vram-warn">Over budget — some models will use CPU</span>
		{:else if pct > 75}
			<span class="vram-tight">Getting tight — consider smaller models</span>
		{/if}
	</div>
{:else}
	<div class="vram-bar-wrap">
		<div class="vram-label">
			<Monitor size={14} />
			<span>No GPU detected — models will use CPU</span>
		</div>
	</div>
{/if}

<style>
	.vram-bar-wrap {
		display: flex; flex-direction: column; gap: 0.375rem;
		width: 100%; padding: 0.75rem 1rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
	}
	.vram-label {
		display: flex; align-items: center; gap: 0.5rem;
		font-size: var(--wiz-text-sm); color: var(--wiz-text-sub);
	}
	.vram-label strong { color: var(--wiz-text); }
	.vram-track {
		width: 100%; height: 0.375rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-void-800); overflow: hidden;
	}
	.vram-fill {
		height: 100%; border-radius: var(--wiz-radius-full);
		transition: width var(--wiz-duration-normal), background var(--wiz-duration-normal);
	}
	.vram-warn { font-size: var(--wiz-text-xs); color: var(--wiz-salmon); }
	.vram-tight { font-size: var(--wiz-text-xs); color: var(--wiz-gold); }
</style>

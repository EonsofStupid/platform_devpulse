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
import { friendlyName, getSlotLabel, ROLE_COLORS } from "../wizard.types.js";

interface SlotSegment {
	slotId: string;
	name: string;
	vramMb: number;
	pct: number;
	color: string;
}

const totalMb = $derived(hardwareState.vramTotalMb ?? 0);

/** Per-slot segments with role colors. */
const segments = $derived.by((): SlotSegment[] => {
	if (totalMb <= 0) return [];
	const segs: SlotSegment[] = [];
	modelsState.userSlots.forEach((slot) => {
		if (!slot.assigned_model_id) return;
		const model = modelsState.models.find((m) => m.id === slot.assigned_model_id);
		if (!model) return;
		const label = getSlotLabel(slot.id);
		const roleColor = label ? ROLE_COLORS[label.role] : null;
		segs.push({
			slotId: slot.id,
			name: friendlyName(slot.id),
			vramMb: model.vram_estimate_mb,
			pct: Math.min(100, (model.vram_estimate_mb / totalMb) * 100),
			color: roleColor?.accent ?? "var(--wiz-void-500)",
		});
	});
	return segs;
});

const allocatedMb = $derived(segments.reduce((s, seg) => s + seg.vramMb, 0));
const totalPct = $derived(totalMb > 0 ? Math.min(100, (allocatedMb / totalMb) * 100) : 0);
const modelCount = $derived(segments.length);
const freeMb = $derived(Math.max(0, totalMb - allocatedMb));

/** Tooltip text: per-model breakdown. */
const tooltipText = $derived.by(() => {
	if (segments.length === 0) return "No models loaded";
	const parts = segments.map((s) => `${s.name}: ${formatMb(s.vramMb)}`);
	parts.push(`Free: ${formatMb(freeMb)}`);
	return parts.join(" | ");
});

let showTooltip = $state(false);
</script>

{#if totalMb > 0}
	<div class="vram-bar-wrap"
		onmouseenter={() => (showTooltip = true)}
		onmouseleave={() => (showTooltip = false)}
		role="meter"
		aria-label="GPU memory usage"
		aria-valuenow={allocatedMb}
		aria-valuemax={totalMb}
	>
		<div class="vram-label">
			<Monitor size={14} />
			<span>
				{modelCount} model{modelCount !== 1 ? "s" : ""} using
				<strong>{formatMb(allocatedMb)}</strong> of {formatMb(totalMb)} GPU memory
			</span>
		</div>
		<div class="vram-track">
			{#each segments as seg (seg.slotId)}
				<div
					class="vram-segment"
					style="width: {seg.pct}%; background: {seg.color};"
					title="{seg.name}: {formatMb(seg.vramMb)}"
				></div>
			{/each}
		</div>
		{#if showTooltip && segments.length > 0}
			<div class="vram-tooltip">{tooltipText}</div>
		{/if}
		{#if totalPct > 90}
			<span class="vram-warn">Over budget — some models will use CPU</span>
		{:else if totalPct > 75}
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
		position: relative; cursor: help;
	}
	.vram-label {
		display: flex; align-items: center; gap: 0.5rem;
		font-size: var(--wiz-text-sm); color: var(--wiz-text-sub);
	}
	.vram-label strong { color: var(--wiz-text); }
	.vram-track {
		display: flex; width: 100%; height: 0.5rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-void-800); overflow: hidden; gap: 1px;
	}
	.vram-segment {
		height: 100%; min-width: 2px;
		transition: width var(--wiz-duration-normal);
	}
	.vram-segment:first-child { border-radius: var(--wiz-radius-full) 0 0 var(--wiz-radius-full); }
	.vram-segment:last-child { border-radius: 0 var(--wiz-radius-full) var(--wiz-radius-full) 0; }
	.vram-segment:only-child { border-radius: var(--wiz-radius-full); }
	.vram-tooltip {
		position: absolute; z-index: var(--wiz-z-tooltip);
		bottom: calc(100% + 0.5rem); left: 50%; transform: translateX(-50%);
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-overlay); border: 1px solid var(--wiz-border-strong);
		color: var(--wiz-text); font-size: var(--wiz-text-xs); line-height: 1.5;
		box-shadow: var(--wiz-shadow-lg); white-space: nowrap; pointer-events: none;
	}
	.vram-warn { font-size: var(--wiz-text-xs); color: var(--wiz-salmon); }
	.vram-tight { font-size: var(--wiz-text-xs); color: var(--wiz-gold); }
</style>

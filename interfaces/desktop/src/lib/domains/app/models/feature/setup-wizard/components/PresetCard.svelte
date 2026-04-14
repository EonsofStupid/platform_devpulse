<!--
  @file PresetCard.svelte
  Commandment #2: Preset first, customize second.
  Shows recommended config as a card with one-click "Download & Set Up".
  Layman names (Commandment #3). Role colors (Commandment #4).
  Local models show checkmark (Commandment #9).
-->
<script lang="ts">
import { Check, Download, Loader2 } from "lucide-svelte";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { formatMb } from "../../../util/models.types.js";
import { wizardState } from "../wizard.state.svelte.js";
import type { ModelRec } from "../wizard.types.js";
import { friendlyName, getSlotLabel, ROLE_COLORS } from "../wizard.types.js";

interface Props {
	recommendations: ModelRec[];
	onSetup: () => void;
	loading: boolean;
}
let { recommendations, onSetup, loading }: Props = $props();

const totalDownloadMb = $derived(
	recommendations.filter((r) => !r.alreadyDownloaded).reduce((s, r) => s + r.sizeMb, 0),
);
const alreadyCount = $derived(recommendations.filter((r) => r.alreadyDownloaded).length);
const needsDownload = $derived(recommendations.filter((r) => !r.alreadyDownloaded).length);

const tierName = $derived.by(() => {
	const vram = hardwareState.vramTotalMb ?? 0;
	if (vram >= 24000) return "Workstation";
	if (vram >= 16000) return "Prosumer";
	if (vram >= 8000) return "Mainstream";
	if (vram >= 4000) return "Entry";
	return "CPU";
});

const gpuLabel = $derived(hardwareState.gpuName ?? "CPU");
</script>

<div class="preset-card">
	<div class="preset-header">
		<h3 class="preset-title">Recommended for your {gpuLabel}</h3>
		<span class="preset-tier">{tierName} tier</span>
	</div>

	<div class="preset-list">
		{#each recommendations as rec (rec.slot)}
			{@const label = getSlotLabel(rec.slot)}
			{@const roleColor = label ? ROLE_COLORS[label.role] : null}
			<div class="preset-item" style="border-left-color: {roleColor?.accent ?? 'var(--wiz-border)'};">
				<div class="item-info">
					<span class="item-name">{friendlyName(rec.slot)}</span>
					<span class="item-desc">{label?.description ?? rec.purpose}</span>
				</div>
				<div class="item-meta">
					<span class="item-size">{formatMb(rec.sizeMb)}</span>
					{#if rec.alreadyDownloaded}
						<span class="item-local"><Check size={12} /> On your computer</span>
					{:else}
						<span class="item-download">Download needed</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="preset-footer">
		{#if needsDownload > 0}
			<span class="footer-info">
				{needsDownload} model{needsDownload > 1 ? "s" : ""} to download ({formatMb(totalDownloadMb)})
				{#if alreadyCount > 0}
					 · {alreadyCount} already on disk
				{/if}
			</span>
		{:else}
			<span class="footer-info footer-ready">
				<Check size={14} /> All models already downloaded
			</span>
		{/if}

		<button class="btn-setup" onclick={onSetup} disabled={loading}>
			{#if loading}
				<Loader2 size={16} class="animate-spin" /> Setting up...
			{:else if needsDownload > 0}
				<Download size={16} /> Download & Set Up
			{:else}
				<Check size={16} /> Set Up Now
			{/if}
		</button>
	</div>
</div>

<style>
	.preset-card {
		width: 100%; max-width: 32rem; border-radius: var(--wiz-radius-xl);
		background: var(--wiz-card-raised); border: 1px solid var(--wiz-border);
		overflow: hidden; box-shadow: var(--wiz-shadow-md);
	}
	.preset-header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 1rem 1.25rem; border-bottom: 1px solid var(--wiz-border);
	}
	.preset-title { font-size: 1rem; font-weight: 700; color: var(--wiz-text); margin: 0; }
	.preset-tier {
		font-size: var(--wiz-text-xs); font-weight: 600; color: var(--wiz-cyan);
		padding: 0.125rem 0.5rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-fill-cyan);
	}

	.preset-list { display: flex; flex-direction: column; }
	.preset-item {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.75rem 1.25rem; border-left: 3px solid transparent;
		border-bottom: 1px solid var(--wiz-void-800);
	}
	.preset-item:last-child { border-bottom: none; }
	.item-info { display: flex; flex-direction: column; gap: 0.125rem; }
	.item-name { font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text); }
	.item-desc { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.item-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.125rem; }
	.item-size { font-size: var(--wiz-text-xs); color: var(--wiz-text-sub); }
	.item-local {
		display: inline-flex; align-items: center; gap: 0.25rem;
		font-size: var(--wiz-text-xs); color: var(--wiz-green);
	}
	.item-download { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	.preset-footer {
		display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
		padding: 1rem 1.25rem; border-top: 1px solid var(--wiz-border);
	}
	.footer-info { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.footer-ready { color: var(--wiz-green); display: inline-flex; align-items: center; gap: 0.25rem; }

	.btn-setup {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.75rem 2rem; border-radius: var(--wiz-radius-lg); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: 1rem; font-weight: 800; cursor: pointer;
		box-shadow: 0 0 1.25rem var(--wiz-glow-cyan);
		transition: all var(--wiz-duration-fast); width: 100%;
		justify-content: center;
	}
	.btn-setup:hover { filter: brightness(1.15); box-shadow: 0 0 2rem var(--wiz-glow-cyan); }
	.btn-setup:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

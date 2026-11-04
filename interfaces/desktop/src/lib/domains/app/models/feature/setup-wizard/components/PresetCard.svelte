<!--
  @file PresetCard.svelte
  Commandment #2: Preset first, customize second.
  Shows recommended config as a card with one-click "Download & Set Up".
  Layman names (Commandment #3). Role colors (Commandment #4).
  Local models show checkmark (Commandment #9).
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Check, Download } from "lucide-svelte";
import { copyState, fill } from "#lib/sys/copy/index.js";
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

const text = $derived(copyState.catalog?.setup_wizard.preset_card ?? null);

const totalDownloadMb = $derived(
	recommendations.filter((r) => !r.alreadyDownloaded).reduce((s, r) => s + r.sizeMb, 0),
);
const alreadyCount = $derived(recommendations.filter((r) => r.alreadyDownloaded).length);
const needsDownload = $derived(recommendations.filter((r) => !r.alreadyDownloaded).length);

// The tier is the kernel's, through the preset it chose. Never recomputed here.
const tierName = $derived(wizardState.selectedPresetName ?? hardwareState.tier ?? "");

const gpuLabel = $derived(hardwareState.gpuName ?? text?.cpu_label ?? "");
</script>

{#if text}

<div class="preset-card">
	<div class="preset-header">
		<h3 class="preset-title">{fill(text.title, { gpu: gpuLabel })}</h3>
		<span class="preset-tier">{fill(text.tier, { tier: tierName })}</span>
	</div>

	<div class="preset-list">
		{#each recommendations as rec (rec.slot)}
			{@const label = getSlotLabel(rec.slot)}
			{@const roleColor = label ? ROLE_COLORS[label.role] : null}
			<div class="preset-item" style:border-left-color={roleColor?.accent ?? "var(--border-subtle)"}>
				<div class="item-info">
					<span class="item-name">{friendlyName(rec.slot)}</span>
					<span class="item-desc">{label?.description ?? rec.purpose}</span>
				</div>
				<div class="item-meta">
					<span class="item-size">{formatMb(rec.sizeMb)}</span>
					{#if rec.alreadyDownloaded}
						<span class="item-local"><Check size={12} /> {text.on_computer}</span>
					{:else}
						<span class="item-download">{text.download_needed}</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<div class="preset-footer">
		{#if needsDownload > 0}
			<span class="footer-info">
				{fill(needsDownload > 1 ? text.to_download_many : text.to_download_one, { count: needsDownload, size: formatMb(totalDownloadMb) })}
				{#if alreadyCount > 0}
					 · {fill(text.already_on_disk, { count: alreadyCount })}
				{/if}
			</span>
		{:else}
			<span class="footer-info footer-ready">
				<Check size={14} /> {text.all_downloaded}
			</span>
		{/if}

		<Button variant="primary" size="lg" class="w-full" onclick={onSetup} disabled={loading}>
			{#if loading}
				<Spinner size="sm" tone="accent" /> {text.setting_up}
			{:else if needsDownload > 0}
				<Download size={16} /> {text.download_and_setup}
			{:else}
				<Check size={16} /> {text.set_up_now}
			{/if}
		</Button>
	</div>
</div>
{/if}

<style>
	.preset-card {
		width: 100%;
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: var(--border-width-thin) solid var(--border-subtle);
		overflow: hidden;
		box-shadow: var(--card-box-shadow);
	}
	.preset-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: var(--border-width-thin) solid var(--border-subtle);
	}
	.preset-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}
	.preset-tier {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--accent-cyan-main);
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-full);
		background: var(--accent-cyan-fill);
	}
	.preset-list {
		display: flex;
		flex-direction: column;
	}
	.preset-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		border-left: var(--border-width-medium) solid transparent;
		border-bottom: var(--border-width-thin) solid var(--border-soft);
	}
	.preset-item:last-child {
		border-bottom: none;
	}
	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.item-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.item-desc,
	.item-download,
	.footer-info {
		font-size: 0.875rem;
		color: var(--text-muted);
	}
	.item-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
	}
	.item-size {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	.item-local {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--signal-success);
	}
	.preset-footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: var(--border-width-thin) solid var(--border-subtle);
	}
	.footer-ready {
		color: var(--signal-success);
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>

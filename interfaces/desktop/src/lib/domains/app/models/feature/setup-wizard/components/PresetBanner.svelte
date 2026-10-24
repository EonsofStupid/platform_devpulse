<!--
  @file PresetBanner.svelte
  @domain models/setup-wizard/components

  Recommendation chassis. Renders the active preset (name + tier + total
  download size + total VRAM) plus per-slot recommended-model rows. Each
  row shows: friendly slot label, repo, filename, size, VRAM estimate,
  and an "already on disk" badge when the file is present.

  This is the SSOT consumer of `wizardState.recommendations` — set by
  `applyJesseConfig()`. Cards (BrainCard / MemoryCard / VisionCard /
  VoiceCard) read the same array per-slot to prefill drafts.

  Layman copy: "Your model plan", not "Auto-Configured Recommendations".
  DTCG tokens throughout.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { Brain, Check, HardDrive, Headphones, Image, Search, Sparkles } from "lucide-svelte";
import { wizardState } from "../wizard.state.svelte.js";
import type { ModelRec } from "../wizard.types.js";

interface Props {
	/** Optional show/hide. Defaults to mounting only when recommendations exist. */
	visible?: boolean;
}

let { visible = true }: Props = $props();

const recs = $derived(wizardState.recommendations);
const presetName = $derived(wizardState.selectedPresetName);
const tier = $derived(wizardState.selectedTier);

const totalDownloadMb = $derived(recs.reduce((sum, r) => sum + r.sizeMb, 0));
const totalVramMb = $derived(recs.reduce((sum, r) => sum + r.vramMb, 0));
const alreadyDownloadedCount = $derived(recs.filter((r) => r.alreadyDownloaded).length);

function formatMb(mb: number): string {
	if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
	return `${Math.round(mb)} MB`;
}

function iconForSlot(slot: ModelRec["slot"]): typeof Brain {
	if (slot === "chat.brain" || slot === "chat.fast" || slot === "minion.shared") return Brain;
	if (slot.startsWith("voice.")) return Headphones;
	if (slot === "vision.embedder" || slot === "chat.vision") return Image;
	return Search;
}

function accentForSlot(slot: ModelRec["slot"]): string {
	if (slot.startsWith("chat.") || slot === "minion.escalation") {
		return "var(--wizard-role-brain-main)";
	}
	if (slot.startsWith("voice.")) return "var(--wizard-role-voice-main)";
	if (slot.startsWith("rag.") || slot.startsWith("vision.")) {
		return "var(--wizard-role-encoder-main)";
	}
	return "var(--wizard-role-minion-main)";
}
</script>

{#if visible && recs.length > 0}
	<div class="preset-banner" role="region" aria-label="Recommended model plan">
		<div class="pb-head">
			<div class="pb-head-icon">
				<Sparkles size={18} />
			</div>
			<div class="pb-head-text">
				<Heading level={3} size="sm">Your model plan</Heading>
				<Text size="xs" color="muted">
					Picked for your hardware. Cards below are pre-filled — review and apply.
				</Text>
			</div>
			<div class="pb-head-meta">
				{#if presetName}
					<Badge variant="positive" size="sm">{presetName}</Badge>
				{/if}
				{#if tier}
					<Badge variant="neutral" size="sm">{tier}</Badge>
				{/if}
			</div>
		</div>

		<div class="pb-summary">
			<div class="pb-stat">
				<HardDrive size={14} />
				<Text size="xs" color="muted">Total download</Text>
				<Text size="xs" weight="bold">{formatMb(totalDownloadMb)}</Text>
			</div>
			<div class="pb-stat">
				<Sparkles size={14} />
				<Text size="xs" color="muted">VRAM needed</Text>
				<Text size="xs" weight="bold">{formatMb(totalVramMb)}</Text>
			</div>
			<div class="pb-stat">
				<Check size={14} />
				<Text size="xs" color="muted">Already on disk</Text>
				<Text size="xs" weight="bold">{alreadyDownloadedCount} of {recs.length}</Text>
			</div>
		</div>

		<ul class="pb-list">
			{#each recs as rec (rec.slot)}
				{@const Icon = iconForSlot(rec.slot)}
				<li class="pb-row" style:--row-accent={accentForSlot(rec.slot)}>
					<div class="pb-row-icon">
						<Icon size={14} />
					</div>
					<div class="pb-row-info">
						<Text size="xs" weight="bold">{rec.purpose}</Text>
						<Text size="xs" color="muted">{rec.repo} / {rec.file}</Text>
					</div>
					<div class="pb-row-meta">
						<Text size="xs" color="muted">{formatMb(rec.sizeMb)}</Text>
						{#if rec.vramMb > 0}
							<Text size="xs" color="muted">{formatMb(rec.vramMb)} VRAM</Text>
						{/if}
						{#if rec.alreadyDownloaded}
							<Badge variant="positive" size="sm">
								<Check size={10} />
								Ready
							</Badge>
						{:else}
							<Badge variant="neutral" size="sm">Will download</Badge>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.preset-banner {
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 1.25vw, 0.875rem);
		padding: clamp(0.75rem, 1.5vw, 1.125rem);
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--accent-teal-fill) 18%, var(--surface-raised));
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 35%, var(--border-soft));
		box-shadow: 0 0.25rem 1rem color-mix(in oklch, var(--accent-teal-main) 8%, transparent);
	}

	.pb-head {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.pb-head-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--accent-teal-main) 30%, transparent);
		color: var(--accent-teal-main);
		flex-shrink: 0;
	}

	.pb-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.pb-head-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.pb-summary {
		display: flex;
		flex-wrap: wrap;
		gap: clamp(0.75rem, 2vw, 1.25rem);
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--surface-base) 60%, transparent);
		border: 1px solid var(--border-soft);
	}

	.pb-stat {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--text-secondary);
	}

	.pb-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin: 0;
		padding: 0;
	}

	.pb-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--row-accent, var(--accent-teal-main));
	}

	.pb-row-icon {
		color: var(--row-accent, var(--accent-teal-main));
		flex-shrink: 0;
	}

	.pb-row-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.pb-row-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex-shrink: 0;
	}
</style>

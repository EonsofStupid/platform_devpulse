<!--
  @file SlotCard.svelte
  Reusable slot display for wizard Steps 2-5.
  Shows slot name, assigned model, status, VRAM fit, and Browse/Search actions.
  Absorbs capabilities from old SlotCard + RoleCard.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { Check, FolderSearch, Search, X } from "lucide-svelte";
import { copyState } from "$lib/sys/copy/index.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { ModelInfo, SlotInfo } from "../../../util/models.types.js";
import { calculateFit, formatMb, isInferenceReady } from "../../../util/models.types.js";
import { getSlotLabel, ROLE_COLORS } from "../wizard.types.js";

interface Props {
	slot: SlotInfo;
	model: ModelInfo | null;
	onBrowseLocal: () => void;
	onSearchHF: () => void;
	optional?: boolean;
}

let { slot, model, onBrowseLocal, onSearchHF, optional = false }: Props = $props();

const label = $derived(getSlotLabel(slot.id));
const roleColor = $derived(label ? ROLE_COLORS[label.role] : null);
const status = $derived(modelsState.statuses[slot.id]);
const ready = $derived(status ? isInferenceReady(status) : false);

const fit = $derived.by(() => {
	if (!model) return null;
	return calculateFit(model.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb);
});

const fitDotColor = $derived.by(() => {
	if (!fit) return "transparent";
	if (fit === "green") return "var(--signal-success)";
	if (fit === "yellow") return "var(--signal-warning)";
	return "var(--signal-error)";
});

const statusText = $derived.by(() => {
	if (!model) return "No model assigned";
	if (ready) return "Ready";
	if (status?.type === "loading") return "Loading...";
	if (status?.type === "warm") return "Standby";
	if (status?.type === "failed") return "Failed";
	return "Assigned";
});

const statusTips = $derived(copyState.catalog?.setup_wizard.slot_card ?? null);
const statusTip = $derived.by(() => {
	if (!statusTips) return undefined;
	if (!model) return statusTips.empty;
	if (ready) return statusTips.ready;
	if (status?.type === "loading") return statusTips.loading;
	if (status?.type === "warm") return statusTips.warm;
	if (status?.type === "failed") return statusTips.failed;
	return statusTips.assigned;
});

const statusTone = $derived.by((): "positive" | "negative" | "informative" | "neutral" => {
	if (ready) return "positive";
	if (status?.type === "failed") return "negative";
	if (status?.type === "loading") return "informative";
	return "neutral";
});
</script>

<div class="slot-card" style:border-left-color={roleColor?.accent ?? "var(--border-subtle)"}>
	<div class="card-body">
		<div class="card-info">
			<Text size="sm" weight="bold">{label?.name ?? slot.id}</Text>
			<Text size="xs" class="card-desc">{label?.description ?? slot.capability}</Text>

			{#if model}
				<div class="model-row">
					<Text size="xs" class="model-name">{model.filename}</Text>
					<Text size="xs" class="model-meta">{formatMb(model.vram_estimate_mb)} VRAM</Text>
					{#if fit}
						<span class="fit-dot" style:background-color={fitDotColor} title="{fit} fit"></span>
					{/if}
				</div>
			{/if}
		</div>

		<div class="card-status" title={statusTip}>
			<Badge variant={statusTone} size="sm">
				{#if ready}<Check size={10} />{/if}
				{#if status?.type === "loading"}<Spinner size="xs" />{/if}
				{#if status?.type === "failed"}<X size={10} />{/if}
				{statusText}
			</Badge>
		</div>
	</div>

	<div class="card-actions">
		<Button variant="secondary" size="sm" onclick={onBrowseLocal}>
			<FolderSearch size={14} />
			Browse Local
		</Button>
		<Button variant="secondary" size="sm" onclick={onSearchHF}>
			<Search size={14} />
			Search HuggingFace
		</Button>
		{#if optional && !model}
			<Text size="xs" class="skip-link">Set up later</Text>
		{/if}
	</div>
</div>

<style>
	.slot-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--border-subtle);
		transition: border-color 150ms ease-out;
	}
	.slot-card:hover {
		border-color: var(--border-subtle);
	}

	.card-body {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.card-desc) {
		color: var(--text-muted);
	}

	.model-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-top: 0.25rem;
	}

	:global(.model-name) {
		font-family: var(--font-mono);
		color: var(--text-secondary);
	}

	:global(.model-meta) {
		color: var(--text-muted);
	}

	.fit-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.card-status {
		flex-shrink: 0;
	}

	.card-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	:global(.skip-link) {
		color: var(--text-muted);
		cursor: default;
		margin-left: auto;
	}
</style>

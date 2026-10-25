<!--
  @file Step-2-Brain.svelte
  Choose primary reasoning LLM. Single slot: chat.brain.
  Absorbs: ModelsStep brain chip selection, SlotSwapPopup recommendation tab.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Brain } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import VramBar from "../components/VramBar.svelte";
import BrowseLocalPopup from "../popups/BrowseLocalPopup.svelte";
import { SlotCard } from "../popups/index.js";
import SearchHfPopup from "../popups/SearchHfPopup.svelte";
import { wizardState } from "../wizard.state.svelte.js";
import { friendlyName } from "../wizard.types.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
}

let { onContinue, onBack }: Props = $props();

let showBrowse = $state(false);
let showSearch = $state(false);

const brainSlot = $derived(modelsState.slots.find((s) => s.id === "chat.brain"));
const brainModel = $derived(
	brainSlot?.assigned_model_id
		? (modelsState.models.find((m) => m.id === brainSlot.assigned_model_id) ?? null)
		: null,
);
const canContinue = $derived(!!brainSlot?.assigned_model_id);

// Recommendation from auto_configure
const brainRec = $derived(wizardState.recommendations.find((r) => r.slot === "chat.brain"));
</script>

<div class="role-step">
	<div class="role-header" style:border-color="var(--accent-teal-main)">
		<Brain size={24} />
		<div class="role-info">
			<Heading level={3} size="lg">Brain</Heading>
			<Text size="sm" class="role-desc">Your primary reasoning engine — this is the model that thinks, writes code, and answers questions.</Text>
		</div>
	</div>

	{#if brainRec && !brainModel}
		<div class="rec-banner">
			<Text size="sm" weight="bold">Recommended for your hardware:</Text>
			<Text size="sm" class="rec-name">{brainRec.name}</Text>
			{#if brainRec.alreadyDownloaded}
				<Text size="xs" class="rec-badge">Already on disk</Text>
			{:else}
				<Text size="xs" class="rec-meta">{brainRec.sizeMb > 0 ? `${Math.round(brainRec.sizeMb)} MB download` : ""}</Text>
			{/if}
		</div>
	{/if}

	<VramBar />

	{#if brainSlot}
		<SlotCard
			slot={brainSlot}
			model={brainModel}
			onBrowseLocal={() => (showBrowse = true)}
			onSearchHF={() => (showSearch = true)}
		/>
	{/if}

	<div class="step-nav">
		<Button preset="button-ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		<Button preset="button-primary" size="md" onclick={onContinue} disabled={!canContinue}>
			Continue
			<ArrowRight size={14} />
		</Button>
	</div>
</div>

<BrowseLocalPopup
	slotId="chat.brain"
	capability="TextGeneration"
	open={showBrowse}
	onSelect={() => { showBrowse = false; void modelsState.refresh(); }}
	onClose={() => (showBrowse = false)}
/>

<SearchHfPopup
	slotId="chat.brain"
	capability="TextGeneration"
	open={showSearch}
	onDownloadStarted={() => {}}
	onClose={() => (showSearch = false)}
/>

<style>
	.role-step {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		max-width: 42rem;
		padding: 1rem 0;
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--accent-teal-main);
		color: var(--text-primary);
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.role-desc) {
		color: var(--text-secondary);
	}

	.rec-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--accent-teal-fill) 80%, transparent);
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 30%, transparent);
		flex-wrap: wrap;
	}

	:global(.rec-name) {
		color: var(--accent-teal-main);
	}

	:global(.rec-meta) {
		color: var(--text-muted);
	}

	:global(.rec-badge) {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--signal-success) 15%, transparent);
		color: var(--signal-success);
	}

	.step-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
	}
</style>

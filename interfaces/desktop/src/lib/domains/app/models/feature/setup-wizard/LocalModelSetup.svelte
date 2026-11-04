<!--
  @file LocalModelSetup.svelte
  @module @devpulse/domains/app/models/feature/setup-wizard

  Models on this computer, inside Your AI: the one place AI gets activated
  (plan 0009, "One DevSpace activation path"). The owner's preset card and
  four role cards, with Clyffy saying what they are, next to your
  subscriptions and endpoints. Every model here is a local endpoint the kernel
  supervises; recommendations come from the kernel's presets.

  Reading the plan downloads nothing. A download starts only from the preset
  card's button or a slot's own button.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { copyState } from "#lib/sys/copy/index.js";
import type { WizardCopy } from "#lib/sys/generated/bindings.js";
import { platformState } from "#lib/sys/runes/platformState.svelte.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import ClyffyNarration from "../../ui/ClyffyNarration.svelte";
import PresetCard from "./components/PresetCard.svelte";
import RoleCardGrid from "./components/RoleCardGrid.svelte";
import SlotSwapPopup from "./components/SlotSwapPopup.svelte";
import {
	cancelActiveDownload,
	downloadAndAssign,
	fetchRecommendations,
	loadWizardCopy,
	setUpRecommended,
} from "./wizard.service.js";
import { wizardState } from "./wizard.state.svelte.js";
import type { DownloadTracker } from "./wizard.types.js";

interface Props {
	/** Opens the guided setup (Set Up Your AI). */
	onOpenSetup: () => void;
	/** Opens Find Models. */
	onBrowse: () => void;
	/** Opens the per-slot assignment page. */
	onAssign: () => void;
}

let { onOpenSetup, onBrowse, onAssign }: Props = $props();

/** The four role cards' slots: Clyffy narrates what happens to them. */
const NARRATED_SLOTS = ["chat.brain", "minion.shared", "rag.embedder", "voice.brain"];

const text = $derived(copyState.catalog?.setup_wizard.local ?? null);

let copy = $state<WizardCopy | null>(null);
let loadError = $state<string | null>(null);
let loadingPlan = $state(false);
let settingUp = $state(false);
let manageSlotId = $state<string | null>(null);
let planLoaded = false;

$effect(() => hardwareState.subscribe("your-ai-local-models"));

// The kernel computes the plan once the platform has booted; reading
// `isReady` re-runs this when boot completes.
$effect(() => {
	if (!platformState.isReady || planLoaded) return;
	planLoaded = true;
	void loadPlan();
});

async function loadPlan(): Promise<void> {
	loadingPlan = true;
	loadError = null;
	try {
		await modelsState.boot();
		copy = await loadWizardCopy();
		await fetchRecommendations();
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	} finally {
		loadingPlan = false;
	}
}

async function handleSetup(): Promise<void> {
	settingUp = true;
	loadError = null;
	try {
		await setUpRecommended(wizardState.recommendations);
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	} finally {
		settingUp = false;
	}
}

async function handleRetryDownload(tracker: DownloadTracker): Promise<void> {
	const rec = wizardState.recommendations.find((r) => r.slot === tracker.slotId);
	wizardState.dismissDownload(tracker.downloadId);
	if (rec) await downloadAndAssign(rec);
}

async function handleSwapSelect(modelId: string): Promise<void> {
	if (manageSlotId) await modelsState.assign(manageSlotId, modelId);
}
</script>

{#if text}
	<section class="flex flex-col gap-3" aria-label={text.heading}>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<Heading level={2} size="lg">{text.heading}</Heading>
			<div class="flex flex-wrap items-center gap-2">
				<Button variant="ghost" size="sm" onclick={onBrowse}>{text.find_models}</Button>
				<Button variant="ghost" size="sm" onclick={onAssign}>{text.assign_slots}</Button>
				<Button variant="secondary" size="sm" onclick={onOpenSetup}>{text.guided_setup}</Button>
			</div>
		</div>

		<div class="clyffy-line">
			<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt={text.mascot_alt} class="clyffy-mascot" />
			<Text as="p" size="sm" color="secondary">{text.intro}</Text>
		</div>

		{#if loadError}
			<InlineMessage tone="error">{loadError}</InlineMessage>
		{/if}
		{#if wizardState.error}
			<InlineMessage tone="error">{wizardState.error}</InlineMessage>
		{/if}

		{#if !platformState.isReady || loadingPlan}
			<div class="flex items-center gap-2">
				<Spinner size="sm" tone="accent" />
				<Text size="sm" color="muted">{text.loading}</Text>
			</div>
		{/if}

		{#if wizardState.recommendations.length > 0}
			<PresetCard recommendations={wizardState.recommendations} onSetup={handleSetup} loading={settingUp} />
		{/if}

		{#if copy?.role_cards && copy.clyffy_tooltips && copy.downloads && copy.loading}
			<RoleCardGrid
				copy={copy.role_cards}
				tooltips={copy.clyffy_tooltips}
				downloadsCopy={copy.downloads}
				loadingCopy={copy.loading}
				onRoleChange={(_role, slot) => (manageSlotId = slot)}
				onCancelDownload={(id) => void cancelActiveDownload(id)}
				onRetryDownload={(tracker) => void handleRetryDownload(tracker)}
				onRetryLoad={(slotId) => void modelsState.load(slotId)}
			/>
		{/if}

		{#each NARRATED_SLOTS as slotId (slotId)}
			<ClyffyNarration {slotId} />
		{/each}
	</section>

	{#if manageSlotId}
		<SlotSwapPopup
			slotId={manageSlotId}
			onSelect={handleSwapSelect}
			onBrowseAll={onBrowse}
			onClose={() => (manageSlotId = null)}
		/>
	{/if}
{/if}

<style>
	.clyffy-line {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.clyffy-mascot {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
	}
</style>

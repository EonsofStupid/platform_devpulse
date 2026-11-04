<!--
  @file SetupWizard.svelte
  @module @devpulse/domains/app/models/feature/setup-wizard

  Main orchestrator for the dev onboarding wizard (restored from
  features/setup-wizard). Coming back to setup, it checks what changed: a
  model whose file is gone opens repair (redownload, pick a different one,
  skip); a different GPU offers to re-check. Then the five views, dispatched
  on `setupWizardOverlayState.view`.

  The progress steps and the Setup button live in the (setup) route layout,
  so the Models and Find Models pages show them too. Nothing here downloads
  or loads anything until you press a button.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { onMount } from "svelte";
import { copyState, fill } from "$lib/sys/copy/index.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import { getCatalogForSlot } from "../../data-access/catalog.service.js";
import { setupWizardOverlayState } from "../../data-access/setup-wizard-overlay.state.svelte.js";
import type { SlotId } from "../../util/models.types.js";
import HfTokenModal from "./components/HfTokenModal.svelte";
import LoadStageOverlay from "./overlays/LoadStageOverlay.svelte";
import ConfigView from "./views/ConfigView.svelte";
import DoneView from "./views/DoneView.svelte";
import SystemCheckView from "./views/SystemCheckView.svelte";
import ValidateView from "./views/ValidateView.svelte";
import WelcomeView from "./views/WelcomeView.svelte";
import { downloadAndAssignFile, subsequentLaunchCheck } from "./wizard.service.js";
import { wizardState } from "./wizard.state.svelte.js";
import { friendlyName } from "./wizard.types.js";

interface Props {
	/** "Pick Different" on a missing model leads here. */
	onPickDifferent?: () => void;
	/** Runs the launch check; off when a page opens one specific step. */
	checkOnOpen?: boolean;
}

let { onPickDifferent, checkOnOpen = true }: Props = $props();

const text = $derived(copyState.catalog?.setup_wizard.repair ?? null);
const overlayState = setupWizardOverlayState;

let showRepairMode = $state(false);
let showHardwareChangeNotice = $state(false);
let missingModels = $state<string[]>([]);
let repairDownloading = $state<Record<string, boolean>>({});
let repairError = $state<string | null>(null);

onMount(() => {
	wizardState.open();
});

let checked = false;
$effect(() => {
	if (!checkOnOpen || checked || !platformState.isReady) return;
	checked = true;
	void init();
});

async function init(): Promise<void> {
	const result = await subsequentLaunchCheck();
	if (result.action === "repair") {
		missingModels = result.missingSlots;
		showRepairMode = true;
	} else if (result.action === "redetect") {
		showHardwareChangeNotice = true;
	}
}

function handleRedetect(): void {
	showHardwareChangeNotice = false;
	overlayState.showSystemCheck();
}

async function handleRedownload(slotId: string): Promise<void> {
	repairError = null;
	repairDownloading = { ...repairDownloading, [slotId]: true };
	try {
		const catalog = await getCatalogForSlot(slotId);
		const option = catalog?.options[0];
		if (!option) {
			repairError = fill(text?.no_source ?? "", { slot: friendlyName(slotId) });
			return;
		}
		await downloadAndAssignFile(option.repo, option.file, slotId as SlotId);
		missingModels = missingModels.filter((s) => s !== slotId);
	} catch (e) {
		repairError = e instanceof Error ? e.message : String(e);
	} finally {
		repairDownloading = { ...repairDownloading, [slotId]: false };
	}
}

function handleRepairSkip(slotId: string): void {
	missingModels = missingModels.filter((s) => s !== slotId);
}
</script>

<div class="wizard-shell" data-component="setup-wizard">
	{#if wizardState.hasActiveDownloads && text}
		<Text size="sm" color="secondary" aria-live="polite">{text.downloading}</Text>
	{/if}

	{#if showRepairMode && text}
		<section class="repair-section">
			<Heading level={2} size="lg">{text.missing_title}</Heading>
			<Text as="p" size="sm" color="secondary">{text.missing_copy}</Text>

			{#if repairError}
				<InlineMessage tone="error">{repairError}</InlineMessage>
			{/if}

			{#each missingModels as slotId (slotId)}
				{@const isDownloading = !!repairDownloading[slotId]}
				<div class="repair-card">
					<div class="repair-header">
						<Text size="sm" weight="bold">{friendlyName(slotId)}</Text>
						<Text size="xs" color="muted">{text.missing_badge}</Text>
					</div>
					<div class="repair-actions">
						<Button variant="primary" size="sm" onclick={() => handleRedownload(slotId)} disabled={isDownloading}>
							{isDownloading ? text.downloading_short : text.redownload}
						</Button>
						<Button variant="secondary" size="sm" onclick={onPickDifferent} disabled={isDownloading}>
							{text.pick_different}
						</Button>
						<Button variant="ghost" size="sm" onclick={() => handleRepairSkip(slotId)} disabled={isDownloading}>
							{text.skip}
						</Button>
					</div>
				</div>
			{/each}

			{#if missingModels.length === 0}
				<Text as="p" size="sm" color="secondary">{text.resolved}</Text>
			{/if}

			<Button variant="primary" size="lg" onclick={() => (showRepairMode = false)}>
				{text.continue}
			</Button>
		</section>
	{:else if showHardwareChangeNotice && text}
		<section class="repair-section">
			<Heading level={2} size="lg">{text.hardware_title}</Heading>
			<Text as="p" size="sm" color="secondary">{text.hardware_copy}</Text>
			<div class="repair-actions">
				<Button variant="primary" size="md" onclick={handleRedetect}>{text.redetect}</Button>
				<Button variant="secondary" size="md" onclick={() => (showHardwareChangeNotice = false)}>
					{text.keep_current}
				</Button>
			</div>
		</section>
	{:else if overlayState.view === "welcome"}
		<WelcomeView />
	{:else if overlayState.view === "system-check"}
		<SystemCheckView />
	{:else if overlayState.view === "config"}
		<ConfigView />
	{:else if overlayState.view === "validate"}
		<ValidateView />
	{:else}
		<DoneView />
	{/if}

	{#if overlayState.error}
		<InlineMessage tone="error">{overlayState.error}</InlineMessage>
	{/if}
</div>

{#if overlayState.copy}
	<HfTokenModal
		open={overlayState.showHfModal}
		copy={overlayState.copy.hf_token}
		initiallyHasToken={overlayState.hfHasToken}
		onClose={() => overlayState.closeHfModal()}
		onSaved={(hasToken) => overlayState.handleHfSaved(hasToken)}
	/>
{/if}

<LoadStageOverlay />

<style>
	.wizard-shell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.repair-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 42rem;
	}

	.repair-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: var(--border-width-thin) solid var(--border-subtle);
		border-left: var(--border-width-medium) solid var(--signal-warning);
	}

	.repair-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.repair-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>

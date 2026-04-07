<!--
  @file SetupWizard.svelte
  @module @devpulse/domains/app/models/features/setup-wizard

  Main orchestrator for the 5-phase dev onboarding wizard.
  Phase progress indicator. Dynamic import of step components.
  Continue gates enforced. Full viewport.

  On subsequent launch: checks if onboarding complete, skips if so.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import { getCatalogForSlot } from "../../services/catalog.service.js";
import {
	downloadModel,
	onDownloadComplete,
	onDownloadProgress,
} from "../../services/download.service.js";
import { friendlySlotLabel } from "../../types/models.types.js";
import { wizardState } from "./wizard.runes.svelte.js";
import {
	evaluateContinueGate,
	fetchRecommendations,
	markOnboardingComplete,
	startHardwareScan,
	subsequentLaunchCheck,
} from "./wizard.service.js";
import { PHASE_INFO, WIZARD_PHASES } from "./wizard.types.js";

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

let initialized = $state(false);
let showRepairMode = $state(false);
let showHardwareChangeNotice = $state(false);
let repairDownloading = $state<Record<string, boolean>>({});
let repairReassigning = $state<string | null>(null);
let repairError = $state<string | null>(null);

$effect(() => {
	init();
});

async function init(): Promise<void> {
	const result = await subsequentLaunchCheck();

	switch (result.action) {
		case "skip":
			onComplete?.();
			return;
		case "wizard":
			await hardwareState.startListening();
			await modelsState.refresh();
			initialized = true;
			break;
		case "repair":
			wizardState.missingModels = result.missingSlots;
			showRepairMode = true;
			await modelsState.refresh();
			initialized = true;
			break;
		case "redetect":
			showHardwareChangeNotice = true;
			await hardwareState.startListening();
			await modelsState.refresh();
			initialized = true;
			break;
	}
}

function handleRedetect(): void {
	showHardwareChangeNotice = false;
	wizardState.currentPhase = "hardware";
}

function handleSkipRedetect(): void {
	showHardwareChangeNotice = false;
	onComplete?.();
}

function handleRepairComplete(): void {
	onComplete?.();
}

/** Redownload a missing model from the catalog for a slot. */
async function handleRedownload(slotId: string): Promise<void> {
	repairError = null;
	repairDownloading = { ...repairDownloading, [slotId]: true };

	try {
		const catalog = await getCatalogForSlot(slotId);
		if (!catalog || catalog.options.length === 0) {
			repairError = `No download source found for ${friendlySlotLabel(slotId)}. Use Reassign to pick a local model instead.`;
			return;
		}

		const opt = catalog.options[0];
		const downloadId = await downloadModel(opt.repo, opt.file);

		const unsubProgress = onDownloadProgress((p) => {
			if (p.downloadId === downloadId) {
				// Progress tracked — repair UI shows downloading state
			}
		});

		await new Promise<void>((resolve, reject) => {
			const unsub = onDownloadComplete((data) => {
				if (data.downloadId === downloadId) {
					unsub();
					resolve();
				}
			});
			setTimeout(() => {
				unsub();
				reject(new Error("Download timed out"));
			}, 600_000);
		});

		unsubProgress();
		await modelsState.refresh();

		// Remove from missing list on success
		wizardState.missingModels = wizardState.missingModels.filter((s) => s !== slotId);
		const { toast } = await import("svelte-sonner");
		toast.success(`${friendlySlotLabel(slotId)} redownloaded`);
	} catch (e) {
		repairError = e instanceof Error ? e.message : String(e);
	} finally {
		repairDownloading = { ...repairDownloading, [slotId]: false };
	}
}

/** Enter reassign mode — navigate to model loader phase for this slot. */
function handleReassign(slotId: string): void {
	repairReassigning = slotId;
	showRepairMode = false;
	wizardState.currentPhase = "models";
	wizardState.importTargetSlot = slotId as import("../../types/models.types.js").SlotId;
}

/** Skip a missing slot — remove from repair list. */
function handleRepairSkip(slotId: string): void {
	wizardState.missingModels = wizardState.missingModels.filter((s) => s !== slotId);
}

const currentGate = $derived(evaluateContinueGate(wizardState.currentPhase));

async function handleWelcomeContinue(): Promise<void> {
	await startHardwareScan();
	await fetchRecommendations();
}

function handleAdvance(): void {
	const gate = evaluateContinueGate(wizardState.currentPhase);
	if (!gate.allMet) return;
	const idx = WIZARD_PHASES.indexOf(wizardState.currentPhase);
	if (idx < WIZARD_PHASES.length - 1) {
		wizardState.currentPhase = WIZARD_PHASES[idx + 1];
	}
}

function handleBack(): void {
	const idx = WIZARD_PHASES.indexOf(wizardState.currentPhase);
	if (idx > 0) {
		wizardState.currentPhase = WIZARD_PHASES[idx - 1];
	}
}

async function handleComplete(): Promise<void> {
	await markOnboardingComplete();
	onComplete?.();
}
</script>

<div
	class={`${stack({ gap: "6", align: "center" })} w-full h-full overflow-y-auto p-6`}
	style="background: var(--surface-base); color: var(--text-primary);"
	data-component="setup-wizard"
>
	<!-- Phase progress indicator -->
	<div class={hstack({ gap: "4", align: "center", justify: "center" })}>
		{#each PHASE_INFO as info, i (info.phase)}
			{@const isCurrent = info.phase === wizardState.currentPhase}
			{@const isDone = i < wizardState.currentPhaseIndex}
			<div class={hstack({ gap: "2", align: "center" })}>
				<span
					class="inline-block w-2.5 h-2.5 rounded-full transition-colors"
					style="background: {isDone ? 'var(--signal-success)' : isCurrent ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
				></span>
				<Text
					size="xs"
					color={isCurrent ? "primary" : isDone ? "secondary" : "muted"}
					weight={isCurrent ? "bold" : "normal"}
				>
					{info.label}
				</Text>
			</div>
			{#if i < PHASE_INFO.length - 1}
				<span class="w-8 h-px" style="background: var(--border-subtle);"></span>
			{/if}
		{/each}
	</div>

	<!-- Repair mode (missing models on subsequent launch) -->
	{#if showRepairMode}
		<div class={`${stack({ gap: "5", align: "center" })} w-full max-w-lg`}>
			<Text size="lg" weight="bold" color="primary">Missing Models</Text>
			<Text size="sm" color="muted">
				Some models are no longer available at their registered paths.
				Redownload from the catalog, reassign to a different local model, or skip.
			</Text>

			{#if repairError}
				<div class="w-full rounded-lg px-4 py-3 border" style="background: oklch(0.25 0.05 25 / 0.5); border-color: var(--signal-error);">
					<Text size="sm" color="primary">{repairError}</Text>
				</div>
			{/if}

			{#each wizardState.missingModels as slotId (slotId)}
				{@const isDownloading = !!repairDownloading[slotId]}
				<div
					class="w-full rounded-lg p-4 border flex flex-col gap-3"
					style="background: var(--surface-elevated); border-color: var(--border-subtle);"
				>
					<div class={hstack({ gap: "3", align: "center" })}>
						<Text size="base" weight="bold" color="primary">{friendlySlotLabel(slotId)}</Text>
						<Badge variant="negative" size="sm">Missing</Badge>
						<Text size="xs" color="muted" class="ml-auto">{slotId}</Text>
					</div>

					<div class={hstack({ gap: "2", justify: "end" })}>
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => handleRedownload(slotId)}
							disabled={isDownloading}
							aria-label="Redownload model for {friendlySlotLabel(slotId)}"
						>
							{#if isDownloading}
								Downloading...
							{:else}
								Redownload
							{/if}
						</button>

						<button
							class="rounded-lg px-4 py-2 text-sm font-bold border transition-colors"
							style="border-color: var(--accent-teal-main); color: var(--accent-teal-main);"
							onclick={() => handleReassign(slotId)}
							disabled={isDownloading}
							aria-label="Reassign a different model to {friendlySlotLabel(slotId)}"
						>
							Reassign
						</button>

						<button
							class="rounded-lg px-4 py-2 text-sm border transition-colors"
							style="border-color: var(--border-subtle); color: var(--text-muted);"
							onclick={() => handleRepairSkip(slotId)}
							disabled={isDownloading}
							aria-label="Skip repair for {friendlySlotLabel(slotId)}"
						>
							Skip
						</button>
					</div>
				</div>
			{/each}

			{#if wizardState.missingModels.length === 0}
				<Text size="sm" color="secondary">All issues resolved.</Text>
			{/if}

			<button
				class="rounded-lg px-6 py-2.5 text-sm font-bold transition-colors"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={handleRepairComplete}
				aria-label="Continue to DevPulse"
			>
				Continue to DevPulse
			</button>
		</div>

	<!-- Hardware change notice -->
	{:else if showHardwareChangeNotice}
		<div class={`${stack({ gap: "4", align: "center" })} w-full max-w-lg`}>
			<Text size="lg" weight="bold" color="primary">Hardware Changed</Text>
			<Text size="sm" color="muted">
				Your GPU changed since last run. Want to re-run hardware detection?
			</Text>
			<div class={hstack({ gap: "3" })}>
				<button
					class="rounded-lg px-4 py-2 text-sm font-bold"
					style="background: var(--accent-teal-main); color: var(--surface-base);"
					onclick={handleRedetect}
				>
					Re-detect Hardware
				</button>
				<button
					class="rounded-lg px-4 py-2 text-sm border"
					style="border-color: var(--border-subtle); color: var(--text-secondary);"
					onclick={handleSkipRedetect}
				>
					Keep Current Config
				</button>
			</div>
		</div>

	<!-- Normal wizard phase content -->
	{:else if initialized}
		{#if wizardState.currentPhase === "hardware"}
			{#if !wizardState.hardwareScanned}
				{#await import("./steps/WelcomeStep.svelte") then mod}
					<mod.default onContinue={handleWelcomeContinue} />
				{/await}
			{:else}
				{#await import("./steps/HardwareDetectionStep.svelte") then mod}
					<mod.default
						onContinue={handleAdvance}
						continueEnabled={currentGate.allMet}
					/>
				{/await}
			{/if}
		{:else if wizardState.currentPhase === "models"}
			{#await import("./steps/ModelLoaderStep.svelte") then mod}
				<mod.default
					onContinue={handleAdvance}
					onBack={handleBack}
					continueEnabled={currentGate.allMet}
					continueBlockers={currentGate.blockers}
				/>
			{/await}
		{:else if wizardState.currentPhase === "voice"}
			{#await import("./steps/VoicePipelineStep.svelte") then mod}
				<mod.default
					onContinue={handleAdvance}
					onBack={handleBack}
					continueEnabled={currentGate.allMet}
					continueBlockers={currentGate.blockers}
				/>
			{/await}
		{:else if wizardState.currentPhase === "clyffy"}
			{#await import("./steps/ClyfActivationStep.svelte") then mod}
				<mod.default
					onContinue={handleAdvance}
					onBack={handleBack}
					continueEnabled={currentGate.allMet}
					continueBlockers={currentGate.blockers}
				/>
			{/await}
		{:else if wizardState.currentPhase === "project"}
			{#await import("./steps/ProjectSetupStep.svelte") then mod}
				<mod.default
					onContinue={handleAdvance}
					onBack={handleBack}
				/>
			{/await}
		{:else if wizardState.currentPhase === "completion"}
			{#await import("./steps/CompletionStep.svelte") then mod}
				<mod.default onComplete={handleComplete} />
			{/await}
		{/if}
	{:else}
		<Text size="sm" color="muted">Initializing...</Text>
	{/if}
</div>

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
import { friendlySlotLabel } from "../../types/models.types.js";
import { wizardState } from "./wizard.runes.svelte.js";
import {
	evaluateContinueGate,
	fetchRecommendations,
	markOnboardingComplete,
	startHardwareScan,
	subsequentLaunchCheck,
} from "./wizard.service.js";
import { PHASE_INFO, WIZARD_PHASES, type WizardPhase } from "./wizard.types.js";

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

let initialized = $state(false);
let showRepairMode = $state(false);
let showHardwareChangeNotice = $state(false);

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
		<div class={`${stack({ gap: "4", align: "center" })} w-full max-w-lg`}>
			<Text size="lg" weight="bold" color="primary">Missing Models</Text>
			<Text size="sm" color="muted">
				Some models are no longer available at their registered paths.
			</Text>
			{#each wizardState.missingModels as slotId (slotId)}
				<div class={hstack({ gap: "3", align: "center" })}>
					<Text size="sm" color="secondary">{friendlySlotLabel(slotId)}</Text>
					<Badge variant="negative" size="sm">Missing</Badge>
					<button
						class="rounded px-3 py-1 text-xs"
						style="color: var(--text-muted);"
						onclick={() => { wizardState.missingModels = wizardState.missingModels.filter(s => s !== slotId); }}
					>
						Skip
					</button>
				</div>
			{/each}
			<button
				class="rounded-lg px-6 py-2 text-sm font-bold"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={handleRepairComplete}
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
					onContinue={handleComplete}
					onBack={handleBack}
				/>
			{/await}
		{/if}
	{:else}
		<Text size="sm" color="muted">Initializing...</Text>
	{/if}
</div>

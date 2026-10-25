<!--
  @file SetupWizard.svelte
  @module @devpulse/domains/app/models/features/setup-wizard

  Main orchestrator for the 7-phase dev onboarding wizard.
  Progress dots. Dynamic step imports. Continue gates.
  Current-setup popup. ColdLight tokens throughout.
-->
<script lang="ts">
import { Settings2 } from "lucide-svelte";
import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import { getCatalogForSlot } from "../../services/catalog.service.js";
import {
	downloadModel,
	onDownloadComplete,
	onDownloadProgress,
} from "../../services/download.service.js";
import CurrentSetupPopup from "./components/CurrentSetupPopup.svelte";
import { wizardState } from "./wizard.runes.svelte.js";
import {
	evaluateContinueGate,
	fetchRecommendations,
	markOnboardingComplete,
	startHardwareScan,
	subsequentLaunchCheck,
} from "./wizard.service.js";
import { friendlyName, PHASE_INFO, PROGRESS_PHASES } from "./wizard.types.js";

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

let initialized = $state(false);
let showRepairMode = $state(false);
let showHardwareChangeNotice = $state(false);
let repairDownloading = $state<Record<string, boolean>>({});
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

async function handleRedownload(slotId: string): Promise<void> {
	repairError = null;
	repairDownloading = { ...repairDownloading, [slotId]: true };

	try {
		const catalog = await getCatalogForSlot(slotId);
		if (!catalog || catalog.options.length === 0) {
			repairError = `No download source found for ${friendlyName(slotId)}. Use Reassign to pick a local model instead.`;
			return;
		}

		const opt = catalog.options[0];
		const downloadId = await downloadModel(opt.repo, opt.file);

		const unsubProgress = onDownloadProgress((p) => {
			if (p.downloadId === downloadId) {
				/* progress tracked in repair UI */
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
		wizardState.missingModels = wizardState.missingModels.filter((s) => s !== slotId);
		const { toast } = await import("svelte-sonner");
		toast.success(`${friendlyName(slotId)} redownloaded`);
	} catch (e) {
		repairError = e instanceof Error ? e.message : String(e);
	} finally {
		repairDownloading = { ...repairDownloading, [slotId]: false };
	}
}

function handleReassign(_slotId: string): void {
	showRepairMode = false;
	wizardState.goTo("browse");
}

function handleRepairSkip(slotId: string): void {
	wizardState.missingModels = wizardState.missingModels.filter((s) => s !== slotId);
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
	wizardState.advance();
}

function handleBack(): void {
	wizardState.goBack();
}

async function handleComplete(): Promise<void> {
	await markOnboardingComplete();
	onComplete?.();
}

/** Phase index among the progress dots (not all phases show dots). */
function progressIndex(phase: string): number {
	return PROGRESS_PHASES.indexOf(phase as (typeof PROGRESS_PHASES)[number]);
}

const currentProgressIdx = $derived(progressIndex(wizardState.currentPhase));
</script>

<div class="wizard-shell" data-component="setup-wizard">
	<!-- Phase progress dots (only main phases, not sub-pages) -->
	<div class="phase-bar">
		<div class="phase-dots">
			{#each PROGRESS_PHASES as phase, i (phase)}
				{@const info = PHASE_INFO.find((p) => p.phase === phase)}
				{@const isCurrent = currentProgressIdx === i}
				{@const isDone = currentProgressIdx > i}
				<div class="phase-item">
					<span class="phase-dot" class:done={isDone} class:current={isCurrent}></span>
					<span class="phase-label" class:active={isCurrent} class:done-label={isDone}>
						{info?.label ?? phase}
					</span>
				</div>
				{#if i < PROGRESS_PHASES.length - 1}
					<span class="phase-line" class:done-line={currentProgressIdx > i}></span>
				{/if}
			{/each}
		</div>

		<!-- Current Setup button -->
		<button
			class="setup-btn"
			onclick={() => (wizardState.showCurrentSetup = !wizardState.showCurrentSetup)}
			aria-label="View current setup"
		>
			<Settings2 size={14} />
			Setup
		</button>
	</div>

	<!-- Download indicator (visible when downloads are running) -->
	{#if wizardState.hasActiveDownloads}
		<div class="download-indicator">
			Downloading models in background...
		</div>
	{/if}

	<!-- Repair mode -->
	{#if showRepairMode}
		<div class="repair-section">
			<h2 class="section-title">Some Models Are Missing</h2>
			<p class="section-desc">
				These models aren't where we left them. Redownload, pick a different one, or skip.
			</p>

			{#if repairError}
				<div class="error-banner">
					<span>{repairError}</span>
					<button class="error-action" onclick={() => (repairError = null)}>Dismiss</button>
				</div>
			{/if}

			{#each wizardState.missingModels as slotId (slotId)}
				{@const isDownloading = !!repairDownloading[slotId]}
				<div class="repair-card">
					<div class="repair-header">
						<span class="repair-slot">{friendlyName(slotId)}</span>
						<span class="repair-badge">Missing</span>
					</div>
					<div class="repair-actions">
						<button class="btn-primary" onclick={() => handleRedownload(slotId)}
							disabled={isDownloading}>
							{isDownloading ? "Downloading..." : "Redownload"}
						</button>
						<button class="btn-outline" onclick={() => handleReassign(slotId)}
							disabled={isDownloading}>
							Pick Different
						</button>
						<button class="btn-ghost" onclick={() => handleRepairSkip(slotId)}
							disabled={isDownloading}>
							Skip
						</button>
					</div>
				</div>
			{/each}

			{#if wizardState.missingModels.length === 0}
				<p class="section-desc">All issues resolved.</p>
			{/if}

			<button class="btn-primary btn-lg" onclick={handleRepairComplete}>
				Continue to DevPulse
			</button>
		</div>

	<!-- Hardware change notice -->
	{:else if showHardwareChangeNotice}
		<div class="repair-section">
			<h2 class="section-title">Your Hardware Changed</h2>
			<p class="section-desc">Your GPU is different from last time. Want to re-check your setup?</p>
			<div class="repair-actions">
				<button class="btn-primary" onclick={handleRedetect}>Re-detect Hardware</button>
				<button class="btn-outline" onclick={handleSkipRedetect}>Keep Current</button>
			</div>
		</div>

	<!-- Normal wizard flow -->
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
			{#await import("./steps/ModelsStep.svelte") then mod}
				<mod.default
					onContinue={handleAdvance}
					onBack={handleBack}
					onCustomize={() => wizardState.goTo("customize")}
					onBrowse={() => wizardState.goTo("browse")}
				/>
			{/await}
		{:else if wizardState.currentPhase === "customize"}
			{#await import("./steps/CustomizeStep.svelte") then mod}
				<mod.default
					onBack={() => wizardState.goTo("models")}
					onBrowse={() => wizardState.goTo("browse")}
					onDone={() => wizardState.goTo("models")}
				/>
			{/await}
		{:else if wizardState.currentPhase === "browse"}
			{#await import("./steps/SearchBrowseStep.svelte") then mod}
				<mod.default
					onBack={() => wizardState.goTo("models")}
					onDone={() => wizardState.goTo("models")}
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
		<p class="init-text">Starting up...</p>
	{/if}
</div>

<CurrentSetupPopup />

<style>
	/*
	 * LOCAL OKLCH — wizard is an exception to ColdLight.
	 * All colors defined here as direct oklch values.
	 * Child components inherit these via CSS cascade.
	 */
	.wizard-shell {
		/* ── Brand colors (oklch from hex) ─────────────────── */
		--wiz-cyan: oklch(0.82 0.14 195);         /* #17deef */
		--wiz-green: oklch(0.66 0.17 155);         /* #29b468 */
		--wiz-hotpink: oklch(0.66 0.22 355);       /* #f8397a */
		--wiz-coral: oklch(0.72 0.16 10);          /* #fc6b83 */
		--wiz-blue: oklch(0.68 0.14 240);          /* #3ea4ea */
		--wiz-salmon: oklch(0.68 0.18 15);         /* #f16971 */
		--wiz-gold: oklch(0.83 0.16 100);          /* #d6d232 */

		/* ── Role colors (from spec) ──────────────────────── */
		--wiz-role-brain: oklch(0.63 0.12 280);    /* purple */
		--wiz-role-minion: oklch(0.66 0.17 155);   /* green */
		--wiz-role-encoder: oklch(0.68 0.14 240);  /* blue */
		--wiz-role-voice: oklch(0.72 0.16 10);     /* coral/orange */

		/* ── Surfaces ─────────────────────────────────────── */
		--wiz-bg: oklch(0.08 0.01 220);            /* void base */
		--wiz-card: oklch(0.12 0.015 220 / 0.8);   /* glass-deep */
		--wiz-card-raised: oklch(0.15 0.01 220 / 0.6); /* glass-smoke */
		--wiz-overlay: oklch(0.10 0.02 220 / 0.9); /* overlay */
		--wiz-inset: oklch(0.06 0.01 220);         /* inset/input bg */

		/* ── Text ─────────────────────────────────────────── */
		--wiz-text: oklch(0.93 0.01 220);          /* primary */
		--wiz-text-sub: oklch(0.72 0.02 220);      /* secondary */
		--wiz-text-muted: oklch(0.55 0.01 220);    /* muted */

		/* ── Borders ──────────────────────────────────────── */
		--wiz-border: oklch(0.25 0.015 220 / 0.5); /* subtle */
		--wiz-border-strong: oklch(0.35 0.02 220);
		--wiz-border-focus: oklch(0.63 0.08 173);  /* teal focus */

		/* ── Glows ────────────────────────────────────────── */
		--wiz-glow-cyan: 0 0 12px oklch(0.82 0.14 195 / 0.4);
		--wiz-glow-green: 0 0 12px oklch(0.66 0.17 155 / 0.4);
		--wiz-glow-purple: 0 0 12px oklch(0.63 0.12 280 / 0.4);
		--wiz-glow-ember: 0 0 12px oklch(0.72 0.16 10 / 0.4);
		--wiz-glow-sm: 0 0 6px oklch(0.66 0.17 155 / 0.3);
		--wiz-glow-md: 0 0 10px oklch(0.82 0.14 195 / 0.4);

		/* ── Accent fills (low-alpha bg tints) ────────────── */
		--wiz-fill-cyan: oklch(0.82 0.14 195 / 0.08);
		--wiz-fill-green: oklch(0.66 0.17 155 / 0.08);
		--wiz-fill-purple: oklch(0.63 0.12 280 / 0.08);
		--wiz-fill-ember: oklch(0.72 0.16 10 / 0.08);
		--wiz-fill-magenta: oklch(0.63 0.14 330 / 0.08);

		/* ── Radii ────────────────────────────────────────── */
		--wiz-radius-xs: 0.125rem;
		--wiz-radius-sm: 0.25rem;
		--wiz-radius-md: 0.5rem;
		--wiz-radius-lg: 0.75rem;
		--wiz-radius-xl: 1rem;
		--wiz-radius-full: 9999px;

		/* ── Motion ───────────────────────────────────────── */
		--wiz-duration-fast: 150ms;
		--wiz-duration-normal: 250ms;

		/* ── Typography ───────────────────────────────────── */
		--wiz-text-xs: 0.75rem;
		--wiz-text-sm: 0.875rem;

		/* ── Z-index ──────────────────────────────────────── */
		--wiz-z-modal: 400;
		--wiz-z-tooltip: 700;

		/* ── Shadows ──────────────────────────────────────── */
		--wiz-shadow-md: 0 4px 16px oklch(0 0 0 / 0.25);
		--wiz-shadow-lg: 0 8px 32px oklch(0 0 0 / 0.35);
		--wiz-shadow-xl: 0 12px 48px oklch(0 0 0 / 0.45);

		/* ── Ember shades (for error states) ──────────────── */
		--wiz-ember-200: oklch(0.80 0.12 25);
		--wiz-ember-300: oklch(0.715 0.12 25);
		--wiz-ember-400: oklch(0.63 0.12 25);
		--wiz-ember-500: oklch(0.545 0.12 25);
		--wiz-ember-600: oklch(0.46 0.12 25);

		/* ── Void shades (for muted UI) ───────────────────── */
		--wiz-void-400: oklch(0.63 0.01 220);
		--wiz-void-500: oklch(0.545 0.01 220);
		--wiz-void-600: oklch(0.46 0.01 220);
		--wiz-void-700: oklch(0.375 0.01 220);
		--wiz-void-800: oklch(0.29 0.01 220);
		--wiz-void-950: oklch(0.12 0.01 220);

		display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
		width: 100%; height: 100%; overflow-y: auto; padding: 1.5rem;
		background: var(--wiz-bg); color: var(--wiz-text);
	}

	/* Phase progress bar */
	.phase-bar {
		display: flex; align-items: center; justify-content: center; gap: 1.5rem;
		width: 100%; max-width: 48rem;
	}
	.phase-dots { display: flex; align-items: center; gap: 0.75rem; flex: 1; justify-content: center; }
	.phase-item { display: flex; align-items: center; gap: 0.375rem; }
	.phase-dot {
		width: 0.5rem; height: 0.5rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-void-700); transition: all var(--wiz-duration-fast);
	}
	.phase-dot.done { background: var(--wiz-green); box-shadow: var(--wiz-glow-sm); }
	.phase-dot.current { background: var(--wiz-cyan); box-shadow: var(--wiz-glow-md); }
	.phase-label { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.phase-label.active { color: var(--wiz-text); font-weight: 700; }
	.phase-label.done-label { color: var(--wiz-text-sub); }
	.phase-line {
		width: 1.5rem; height: 1px; background: var(--wiz-void-700);
		transition: background var(--wiz-duration-fast);
	}
	.phase-line.done-line { background: var(--wiz-green); }

	/* Current setup button */
	.setup-btn {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.375rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-sub); font-size: var(--wiz-text-xs);
		cursor: pointer; transition: all var(--wiz-duration-fast);
	}
	.setup-btn:hover { border-color: var(--wiz-cyan); color: var(--wiz-text); }

	/* Download indicator */
	.download-indicator {
		font-size: var(--wiz-text-xs); color: var(--wiz-cyan);
		padding: 0.375rem 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-fill-cyan); border: 1px solid oklch(0.82 0.14 195 / 0.3);
	}

	/* Repair / notice sections */
	.repair-section {
		display: flex; flex-direction: column; align-items: center; gap: 1.25rem;
		width: 100%; max-width: 32rem;
	}
	.section-title { font-size: 1.125rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.section-desc {
		font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0;
		text-align: center; line-height: 1.5;
	}
	.error-banner {
		width: 100%; padding: 0.75rem 1rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-fill-ember); border: 1px solid var(--wiz-ember-500);
		color: var(--wiz-ember-200); font-size: var(--wiz-text-sm);
		display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
	}
	.error-action {
		padding: 0.25rem 0.5rem; border-radius: var(--wiz-radius-sm);
		border: 1px solid var(--wiz-ember-400); background: transparent;
		color: var(--wiz-ember-200); font-size: var(--wiz-text-xs); cursor: pointer;
	}

	.repair-card {
		width: 100%; padding: 1rem; border-radius: var(--wiz-radius-lg);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
		display: flex; flex-direction: column; gap: 0.75rem;
	}
	.repair-header { display: flex; align-items: center; gap: 0.75rem; }
	.repair-slot { font-size: 0.9375rem; font-weight: 700; color: var(--wiz-text); }
	.repair-badge {
		font-size: var(--wiz-text-xs); font-weight: 600;
		padding: 0.125rem 0.5rem; border-radius: var(--wiz-radius-full);
		background: var(--wiz-fill-ember); color: var(--wiz-salmon);
	}
	.repair-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }

	/* Buttons */
	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.btn-primary:hover { filter: brightness(1.15); }
	.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-primary.btn-lg {
		padding: 0.625rem 1.5rem; font-size: 0.9375rem; font-weight: 800;
		border-radius: var(--wiz-radius-lg);
	}
	.btn-outline {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-sub); font-size: var(--wiz-text-sm); cursor: pointer;
	}
	.btn-outline:hover { border-color: var(--wiz-cyan); color: var(--wiz-text); }
	.btn-ghost {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md);
		border: none; background: transparent;
		color: var(--wiz-text-muted); font-size: var(--wiz-text-sm); cursor: pointer;
	}
	.btn-ghost:hover { color: var(--wiz-text-sub); }

	.init-text { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); }
</style>

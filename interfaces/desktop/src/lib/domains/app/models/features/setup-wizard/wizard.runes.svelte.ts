/**
 * @file Wizard State Rune
 * @module @devpulse/domains/app/models/features/setup-wizard/runes
 *
 * Svelte 5 rune state for the dev onboarding wizard orchestrator.
 * Tracks current phase, continue gates, recommendations, download state.
 */

import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import type { AutoConfig } from "../../types/models.types.js";
import { friendlySlotPurpose } from "../../types/models.types.js";
import {
	type HardwareProfile,
	type ModelRec,
	type ResourceRule,
	tierToProfile,
	type VoiceConfig,
	WIZARD_PHASES,
	type WizardPhase,
} from "./wizard.types.js";

class WizardState {
	// ── Phase Navigation ─────────────────────────────────
	currentPhase = $state<WizardPhase>("hardware");

	// ── Phase 1: Hardware ────────────────────────────────
	hardwareProfile = $derived<HardwareProfile>(tierToProfile(hardwareState.tier));
	hardwareScanned = $state(false);

	// ── Phase 2: Models ──────────────────────────────────
	recommendations = $state<ModelRec[]>([]);
	downloadQueue = $state<ModelRec[]>([]);
	downloadingIndex = $state(-1);
	downloadProgress = $state(0);
	resourceRules = $state<ResourceRule[]>([]);
	showModelBrowser = $state(false);
	showImportPrompt = $state(false);
	importTargetSlot = $state<string | null>(null);

	// ── Phase 3: Voice ───────────────────────────────────
	voiceConfig = $state<VoiceConfig>({
		latencyToleranceMs: 2500,
		deliveryMode: "buffer",
		memoryLaneProtocol: "rkyv",
	});

	// ── Phase 4: Clyffy ──────────────────────────────────
	roundTripCount = $state(0);
	clyfConfirmed = $state(false);

	// ── Phase 5: Project ─────────────────────────────────
	devProfileExists = $state(false);
	indexingStarted = $state(false);

	// ── Subsequent Launch ────────────────────────────────
	missingModels = $state<string[]>([]);
	hardwareChanged = $state(false);

	// ── Global ───────────────────────────────────────────
	error = $state<string | null>(null);
	onboardingComplete = $state(false);

	// ── Phase Index ──────────────────────────────────────

	get currentPhaseIndex(): number {
		return WIZARD_PHASES.indexOf(this.currentPhase);
	}

	get isFirstPhase(): boolean {
		return this.currentPhaseIndex === 0;
	}

	get isLastPhase(): boolean {
		return this.currentPhaseIndex === WIZARD_PHASES.length - 1;
	}

	// ── Navigation ───────────────────────────────────────

	advance(): void {
		const idx = this.currentPhaseIndex;
		if (idx < WIZARD_PHASES.length - 1) {
			this.currentPhase = WIZARD_PHASES[idx + 1];
		}
	}

	goBack(): void {
		const idx = this.currentPhaseIndex;
		if (idx > 0) {
			this.currentPhase = WIZARD_PHASES[idx - 1];
		}
	}

	// ── Recommendations ──────────────────────────────────

	/** Convert kernel AutoConfig to wizard ModelRec array. */
	setRecommendations(config: AutoConfig): void {
		this.recommendations = config.recommendations.map((rec) => ({
			name: rec.modelFilename.replace(/\.gguf$/i, "").replace(/-/g, " "),
			purpose: friendlySlotPurpose(rec.slotId),
			slot: rec.slotId,
			sizeMb: rec.modelSizeMb,
			vramMb: rec.vramEstimateMb,
			repo: rec.modelRepoId,
			file: rec.modelFilename,
			device: rec.device,
		}));
	}
}

export const wizardState = new WizardState();

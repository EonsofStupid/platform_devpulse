/**
 * @file Wizard State Rune
 * @module @devpulse/domains/app/models/features/setup-wizard/runes
 *
 * Svelte 5 rune state for the dev onboarding wizard orchestrator.
 * Types derive from engine SSOT (events.rs AllocationMode, LoadingState).
 */

import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import type { AutoConfig, SlotId } from "../../types/models.types.js";
import { friendlySlotPurpose } from "../../types/models.types.js";
import {
	type AllocationMode,
	DEFAULT_ESCALATION,
	type EscalationConfig,
	type ModelRec,
	tierToAllocation,
	type VoiceConfig,
	WIZARD_PHASES,
	type WizardPhase,
} from "./wizard.types.js";

class WizardState {
	// ── Phase Navigation ─────────────────────────────────
	currentPhase = $state<WizardPhase>("hardware");

	// ── Phase 1: Hardware ────────────────────────────────
	allocationMode = $derived<AllocationMode>(
		tierToAllocation(hardwareState.tier, hardwareState.vramTotalMb),
	);
	hardwareScanned = $state(false);

	// ── Phase 2: Models ──────────────────────────────────
	recommendations = $state<ModelRec[]>([]);
	downloadQueue = $state<ModelRec[]>([]);
	downloadingIndex = $state(-1);
	downloadProgress = $state(0);
	showModelBrowser = $state(false);
	showImportPrompt = $state(false);
	importTargetSlot = $state<SlotId | null>(null);

	// ── Per-Download Progress (wired to Rust events via wizard.service.ts) ──
	activeDownloads = $state<
		Record<
			string,
			{
				downloadId: string;
				slot: SlotId;
				filename: string;
				bytesDownloaded: number;
				totalBytes: number;
				speedBps: number;
				status: "active" | "complete" | "failed" | "cancelled";
				error?: string;
			}
		>
	>({});

	trackDownload(downloadId: string, slot: SlotId, filename: string): void {
		this.activeDownloads = {
			...this.activeDownloads,
			[downloadId]: {
				downloadId,
				slot,
				filename,
				bytesDownloaded: 0,
				totalBytes: 0,
				speedBps: 0,
				status: "active",
			},
		};
	}

	updateDownloadProgress(
		downloadId: string,
		bytesDownloaded: number,
		totalBytes: number,
		speedBps: number,
	): void {
		const dl = this.activeDownloads[downloadId];
		if (dl) {
			this.activeDownloads = {
				...this.activeDownloads,
				[downloadId]: { ...dl, bytesDownloaded, totalBytes, speedBps },
			};
		}
	}

	completeDownload(downloadId: string): void {
		const dl = this.activeDownloads[downloadId];
		if (dl) {
			this.activeDownloads = {
				...this.activeDownloads,
				[downloadId]: { ...dl, status: "complete" },
			};
		}
	}

	failDownload(downloadId: string, error: string): void {
		const dl = this.activeDownloads[downloadId];
		if (dl) {
			this.activeDownloads = {
				...this.activeDownloads,
				[downloadId]: { ...dl, status: "failed", error },
			};
		}
	}

	downloadForSlot(slotId: SlotId) {
		return (
			Object.values(this.activeDownloads).find((d) => d.slot === slotId && d.status === "active") ??
			null
		);
	}

	get hasActiveDownloads(): boolean {
		return Object.values(this.activeDownloads).some((d) => d.status === "active");
	}

	// ── Phase 3: Voice ───────────────────────────────────
	voiceConfig = $state<VoiceConfig>({
		latencyToleranceMs: 2500,
		deliveryMode: "buffer",
	});
	escalationConfig = $state<EscalationConfig>(DEFAULT_ESCALATION);

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
			slot: rec.slotId as SlotId,
			sizeMb: rec.modelSizeMb,
			vramMb: rec.vramEstimateMb,
			repo: rec.modelRepoId,
			file: rec.modelFilename,
			device: rec.device,
		}));
	}
}

export const wizardState = new WizardState();

/**
 * @file Wizard State Rune
 * @module @devpulse/domains/app/models/features/setup-wizard/runes
 *
 * Svelte 5 rune state for the 8-phase dev onboarding wizard.
 * Follows 10 Commandments: preset-first, layman names, background downloads.
 */

import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import type { AutoConfig, HardwareTier, SlotId } from "../../types/models.types.js";
import {
	type AllocationMode,
	DEFAULT_ESCALATION,
	type DownloadTracker,
	type EscalationConfig,
	friendlyName,
	type ModelRec,
	tierToAllocation,
	type VoiceConfig,
	WIZARD_PHASES,
	type WizardPhase,
} from "./wizard.types.js";

class WizardState {
	// ── Overlay open/close ───────────────────────────────
	/**
	 * Whether the Setup Wizard overlay is currently mounted and visible.
	 *
	 * Set to `true` by `platformState.init()` when `is_first_run` returns
	 * truthy, or by manual calls to `wizardState.open()`. Set to `false` by
	 * `wizardState.close()` when the user exits or the final phase runs
	 * `complete_model_setup`. The overlay component subscribes to this
	 * field and renders inside `Frame.svelte` as a sibling of
	 * `SwapOverlay` — it is not a route, it is not its own shell, it is a
	 * component mounted over whatever (app) view the user is on.
	 */
	isOpen = $state(false);

	// ── Phase Navigation ─────────────────────────────────
	currentPhase = $state<WizardPhase>("hardware");

	// ── Phase 1: Hardware ────────────────────────────────
	allocationMode = $derived<AllocationMode>(
		tierToAllocation(hardwareState.tier, hardwareState.vramTotalMb),
	);
	hardwareScanned = $state(false);

	// ── Phase 2: Models (preset-first) ──────────────────
	recommendations = $state<ModelRec[]>([]);

	/**
	 * Name of the hardware preset the owner has currently selected — either
	 * auto-detected on scan or manually overridden in the welcome preset picker.
	 * Matches `AutoConfig.preset_name` from the Rust side (e.g. "Jesse Primary
	 * (16GB)", "Floor (8GB)", "Floor — CPU Mode").
	 */
	selectedPresetName = $state<string | null>(null);

	/**
	 * Hardware tier of the currently-selected preset. Tracked alongside
	 * `selectedPresetName` so the Models page brain-chooser can highlight
	 * the active chip without having to reverse-map the display name back
	 * into a tier.
	 */
	selectedTier = $state<HardwareTier | null>(null);

	// ── Bulk Download State ─────────────────────────────
	downloadQueue = $state<ModelRec[]>([]);
	downloadingIndex = $state(-1);
	downloadProgress = $state(0);

	// ── Phase 3: Browse ─────────────────────────────────
	browseTab = $state<"local" | "huggingface">("local");
	showImportPrompt = $state(false);
	importTargetSlot = $state<SlotId | null>(null);

	// ── Phase 4: Clyffy ─────────────────────────────────
	roundTripCount = $state(0);
	clyfConfirmed = $state(false);

	// ── Phase 5: Project ────────────────────────────────
	devProfileExists = $state(false);

	// ── UI State ─────────────────────────────────────────
	showCurrentSetup = $state(false);
	error = $state<string | null>(null);
	onboardingComplete = $state(false);

	// ── Subsequent Launch ────────────────────────────────
	missingModels = $state<string[]>([]);
	hardwareChanged = $state(false);

	// ── Voice Config ─────────────────────────────────────
	voiceConfig = $state<VoiceConfig>({
		latencyToleranceMs: 2500,
		deliveryMode: "buffer",
	});
	escalationConfig = $state<EscalationConfig>(DEFAULT_ESCALATION);

	// ── Download Queue (Commandment #7: background downloads) ──

	activeDownloads = $state<Record<string, DownloadTracker>>({});

	trackDownload(downloadId: string, slot: SlotId, filename: string): void {
		this.activeDownloads = {
			...this.activeDownloads,
			[downloadId]: {
				downloadId,
				slotId: slot,
				filename,
				friendlyName: friendlyName(slot),
				bytesDownloaded: 0,
				totalBytes: 0,
				speedBps: 0,
				status: "queued",
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
				[downloadId]: { ...dl, bytesDownloaded, totalBytes, speedBps, status: "downloading" },
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

	downloadForSlot(slotId: SlotId): DownloadTracker | null {
		return (
			Object.values(this.activeDownloads).find(
				(d) => d.slotId === slotId && (d.status === "downloading" || d.status === "queued"),
			) ?? null
		);
	}

	get hasActiveDownloads(): boolean {
		return Object.values(this.activeDownloads).some(
			(d) => d.status === "downloading" || d.status === "queued",
		);
	}

	get downloadList(): DownloadTracker[] {
		return Object.values(this.activeDownloads);
	}

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

	/** Jump to a specific phase (for Customize/Browse escape hatches). */
	goTo(phase: WizardPhase): void {
		this.currentPhase = phase;
	}

	// ── Overlay lifecycle ────────────────────────────────

	/**
	 * Open the Setup Wizard overlay. Idempotent — calling while already
	 * open does nothing. Triggered on first run or manual invocation.
	 */
	open(): void {
		this.isOpen = true;
	}

	/**
	 * Close the Setup Wizard overlay. Idempotent. Called when the user
	 * finishes the final phase, explicitly dismisses the overlay, or the
	 * platform reports the setup is complete.
	 */
	close(): void {
		this.isOpen = false;
	}

	// ── Recommendations ──────────────────────────────────

	/** Convert kernel AutoConfig to wizard ModelRec array.
	 *  Rust serializes as snake_case — field names match Rust struct. */
	setRecommendations(config: AutoConfig): void {
		this.selectedTier = config.tier;
		this.selectedPresetName = config.preset_name;
		this.recommendations = config.recommendations.map((rec) => ({
			name: rec.model_filename.replace(/\.gguf$/i, "").replace(/-/g, " "),
			purpose: friendlyName(rec.slot_id),
			slot: rec.slot_id as SlotId,
			sizeMb: rec.model_size_mb,
			vramMb: rec.vram_estimate_mb,
			repo: rec.model_repo_id,
			file: rec.model_filename,
			device: rec.device,
			alreadyDownloaded: rec.already_downloaded,
		}));
	}
}

export const wizardState = new WizardState();

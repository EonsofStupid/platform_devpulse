/**
 * @file Wizard State Rune
 * @module @devpulse/domains/app/models/feature/setup-wizard/runes
 *
 * Svelte 5 rune state for the setup wizard. Two generations live here:
 *
 * - **View navigation** (`view`, `next`, `back`, `goTo`, `finish`) drives
 *   `SetupWizardOverlay`, the single-screen cortex wizard (restored from
 *   e0b576ff^). The kernel-side copy lives in `kernel/model-loader/src/wizard/`.
 * - **Phase navigation + trackers** (`currentPhase`, downloads, loads,
 *   recommendations) from the 8-phase wizard (restored from 2035d613^); the
 *   Model Loader cards read the trackers.
 *
 * Follows 10 Commandments: preset-first, layman names, background downloads.
 */

import { isFirstRun, markSetupComplete } from "$lib/sys/bindings/models/index.js";
import { logInfo, logWarn } from "$lib/sys/logger.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import type { AutoConfig, HardwareTier, SlotId } from "../../util/models.types.js";
import {
	type AllocationMode,
	type DownloadTracker,
	friendlyName,
	type LoadingStageKind,
	type LoadingTracker,
	type ModelRec,
	tierToAllocation,
	WIZARD_PHASES,
	type WizardPhase,
} from "./wizard.types.js";

export type WizardView =
	| "welcome"
	| "hardware"
	| "preset"
	| "cortex"
	| "slot-save"
	| "installing"
	| "clyffy-collab"
	| "complete";

/**
 * Order in which views advance via `next()` / `back()`. `cortex`
 * replaces `slot-save` as the primary per-slot step (anatomy-tile
 * constellation). `slot-save` stays in the type union so the older
 * `SlotSaveView.svelte` file still type-checks against direct
 * `goTo("slot-save")` callers, but it's no longer reachable through
 * `next()`/`back()` — the cortex view is the wizard surface customers
 * actually see. `clyffy-collab` sits between installing and complete
 * so the customer sees the Claude collab option AFTER models have
 * finished landing — easier to make the "do you also want Claude?"
 * decision when the local setup is visibly in place.
 */
const VIEW_ORDER: readonly WizardView[] = [
	"welcome",
	"hardware",
	"preset",
	"cortex",
	"installing",
	"clyffy-collab",
	"complete",
] as const;

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

	// ── View Navigation (SetupWizardOverlay) ─────────────
	/**
	 * Current view.
	 *
	 * The wizard collapses to a single-screen experience anchored on the
	 * `cortex` view — five anatomy tiles + Clyffy mascot, per the locked
	 * "one clear screen" customer requirement. The welcome / hardware /
	 * preset / installing / clyffy-collab / complete views remain
	 * reachable destinations (per-view `goTo()`) but the overlay lands
	 * the customer on cortex directly.
	 */
	view = $state<WizardView>("cortex");
	/** Whether the platform reports this is the user's first launch. */
	firstRun = $state<boolean | null>(null);

	// ── Phase Navigation ─────────────────────────────────
	currentPhase = $state<WizardPhase>("welcome");

	// ── Phase 1: Hardware ────────────────────────────────
	allocationMode = $derived<AllocationMode>(
		// Until the kernel reports this machine's tier, the most conservative one.
		tierToAllocation(hardwareState.tier ?? "Minimal", hardwareState.vramTotalMb ?? undefined),
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

	// ── System Check Results (Step-1) ───────────────────
	systemCheckResults = $state<
		Array<{ label: string; status: "pending" | "running" | "done" | "error"; result: string }>
	>([]);
	recommendedTier = $state<string | null>(null);

	// ── UI State ─────────────────────────────────────────
	showCurrentSetup = $state(false);
	error = $state<string | null>(null);

	// ── Download Queue (Commandment #7: background downloads) ──

	activeDownloads = $state<Record<string, DownloadTracker>>({});

	trackDownload(downloadId: string, slot: SlotId, filename: string): void {
		const existing = this.activeDownloads[downloadId];
		this.activeDownloads = {
			...this.activeDownloads,
			[downloadId]: {
				downloadId,
				slotId: slot,
				filename,
				friendlyName: friendlyName(slot),
				bytesDownloaded: existing?.bytesDownloaded ?? 0,
				totalBytes: existing?.totalBytes ?? 0,
				speedBps: existing?.speedBps ?? 0,
				status: existing?.status ?? "queued",
				error: existing?.error,
				repoId: existing?.repoId,
				startedAtMs: existing?.startedAtMs ?? Date.now(),
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

	dismissDownload(downloadId: string): void {
		if (!(downloadId in this.activeDownloads)) return;
		const next: Record<string, DownloadTracker> = {};
		for (const [id, dl] of Object.entries(this.activeDownloads)) {
			if (id !== downloadId) next[id] = dl;
		}
		this.activeDownloads = next;
	}

	// ── Load Queue (per-slot model loading progress) ─────────────
	//
	// Populated by `download-bootstrap.ts` — every `LoadingStarted`,
	// `LoadingStage`, `LoadingComplete`, and `LoadingFailed` event the
	// kernel emits flows into these methods. The overlay's role cards
	// subscribe to `activeLoads[slotId]` and flip to a Clyffy spinner
	// whenever the tracker is non-null.
	//
	// Keyed by `slotId` — only one load per slot can be in-flight at a
	// time, enforced by the kernel's `SwapGuard`.

	activeLoads = $state<Record<SlotId, LoadingTracker>>({} as Record<SlotId, LoadingTracker>);

	startLoad(slotId: SlotId, modelId: string, friendly: string): void {
		this.activeLoads = {
			...this.activeLoads,
			[slotId]: {
				slotId,
				modelId,
				friendlyName: friendly,
				stage: "reading",
				progressPct: null,
				error: null,
				startedAtMs: Date.now(),
			},
		};
	}

	updateLoadStage(slotId: SlotId, stage: LoadingStageKind, progressPct: number | null): void {
		const lt = this.activeLoads[slotId];
		if (!lt) return;
		this.activeLoads = {
			...this.activeLoads,
			[slotId]: { ...lt, stage, progressPct },
		};
	}

	completeLoad(slotId: SlotId): void {
		const lt = this.activeLoads[slotId];
		if (!lt) return;
		this.activeLoads = {
			...this.activeLoads,
			[slotId]: { ...lt, stage: "ready", progressPct: 100 },
		};
	}

	failLoad(slotId: SlotId, error: string): void {
		const lt = this.activeLoads[slotId];
		if (!lt) return;
		this.activeLoads = {
			...this.activeLoads,
			[slotId]: { ...lt, stage: "failed", error },
		};
	}

	clearLoad(slotId: SlotId): void {
		if (!(slotId in this.activeLoads)) return;
		const next = {} as Record<SlotId, LoadingTracker>;
		for (const [id, lt] of Object.entries(this.activeLoads) as [SlotId, LoadingTracker][]) {
			if (id !== slotId) next[id] = lt;
		}
		this.activeLoads = next;
	}

	loadForSlot(slotId: SlotId): LoadingTracker | null {
		return this.activeLoads[slotId] ?? null;
	}

	get hasActiveLoads(): boolean {
		return Object.values(this.activeLoads).some((l) => l.stage !== "ready" && l.stage !== "failed");
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
			const next = WIZARD_PHASES[idx + 1];
			logInfo("wizard.state", `advance: ${this.currentPhase} → ${next}`);
			this.currentPhase = next;
		} else {
			logWarn("wizard.state", `advance: already at last phase (${this.currentPhase})`);
		}
	}

	goBack(): void {
		const idx = this.currentPhaseIndex;
		if (idx > 0) {
			const prev = WIZARD_PHASES[idx - 1];
			logInfo("wizard.state", `goBack: ${this.currentPhase} → ${prev}`);
			this.currentPhase = prev;
		}
	}

	goToPhase(phase: WizardPhase): void {
		logInfo("wizard.state", `goToPhase: ${this.currentPhase} → ${phase}`);
		this.currentPhase = phase;
	}

	/** Jump to a specific view. */
	goTo(view: WizardView): void {
		logInfo("wizard.state", `goTo: ${this.view} → ${view}`);
		this.view = view;
	}

	/** Advance to the next view. No-op past `complete`. */
	next(): void {
		const i = VIEW_ORDER.indexOf(this.view);
		if (i >= 0 && i < VIEW_ORDER.length - 1) {
			this.view = VIEW_ORDER[i + 1] as WizardView;
		}
	}

	/** Step back one view. No-op before `welcome`. */
	back(): void {
		const i = VIEW_ORDER.indexOf(this.view);
		if (i > 0) {
			this.view = VIEW_ORDER[i - 1] as WizardView;
		}
	}

	/** Refresh `firstRun` from the kernel. */
	async refreshFirstRun(): Promise<void> {
		const r = await isFirstRun();
		if (r.status === "ok") {
			this.firstRun = r.data;
		} else {
			logWarn("wizard.state", `refreshFirstRun failed: ${r.error}`);
			this.firstRun = false;
		}
	}

	/**
	 * Mark setup complete with the kernel + close the overlay. Called
	 * from the `complete` view's "Finish" button and the cortex view's
	 * "Done".
	 */
	async finish(): Promise<void> {
		const r = await markSetupComplete();
		if (r.status === "error") {
			logWarn("wizard.state", `finish failed: ${r.error}`);
			throw new Error(`markSetupComplete failed: ${r.error}`);
		}
		this.firstRun = false;
		this.close();
	}

	// ── Overlay lifecycle ─────────────���──────────────────

	open(): void {
		logInfo("wizard.state", `open() — phase=${this.currentPhase}`);
		this.isOpen = true;
	}

	close(): void {
		logInfo("wizard.state", `close() — phase=${this.currentPhase}`);
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

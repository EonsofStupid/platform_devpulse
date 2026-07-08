/**
 * @file wizard.types.ts
 * @module @devpulse/domains/app/models/feature/setup-wizard/util/wizard-types
 *
 * Typed prop contracts for the per-view wizard files under
 * `feature/views/`. Each view receives ONE typed struct — never a
 * flat string list — per the ONBOARDING-CASCADE Layer 2 hard rule:
 *
 *   "Single typed prop struct (no flat string list)"
 *
 * Until the Sprint 00 cascade resolver lands, copy comes directly
 * from `getWizardCopy()` and tier comes from `getTierDisplay()`.
 * The view-level prop types here are stable across that migration —
 * the cascade resolver returns the same shape once it's wired.
 */

import type {
	CompletionCopy,
	ConnectCopy,
	DownloadsCopy,
	GreetingCopy,
	HardwareCopy,
	ProfileCopy,
	TierDisplay,
} from "$lib/sys/generated/bindings.js";

/**
 * One row of the kernel's `AutoConfig.recommendations` JSON. Mirrors
 * `SlotRecommendation` in `kernel/model-loader/src/hardware/auto_config.rs`.
 *
 * `already_downloaded` lets the InstallingView show the right total
 * instead of pretending nothing is queued when every recommended
 * file is already on disk (the chain still runs as download→scan→
 * assign→load with download being a no-op via HF cache).
 */
export interface SlotRecommendation {
	slot_id: string;
	model_repo_id: string;
	model_filename: string;
	model_size_mb: number;
	vram_estimate_mb: number;
	already_downloaded: boolean;
	device: string;
	/** Optional customer-facing model label set by the preset author
	 *  (`display_name` in `kernel/model-loader/config/presets.default.toml`).
	 *  Absent → wizard derives a label from `model_repo_id`. */
	display_name?: string | null;
	/** Optional one-line layman tagline set by the preset author.
	 *  Absent → wizard derives an engine-aware fallback from
	 *  `model_filename` (e.g. ".gguf" → "Runs through llama.cpp"). */
	display_tagline?: string | null;
}

/**
 * Callbacks every view's footer / inline actions invoke. The
 * dispatcher root (SetupWizardOverlay) supplies these — views never
 * import `wizardState` directly so they remain trivially testable
 * with a stub object.
 */
export interface WizardCallbacks {
	/** Advance to the next view. No-op past `complete`. */
	onNext: () => void | Promise<void>;
	/** Step back one view. No-op before `welcome`. */
	onBack: () => void;
	/** Mark setup complete + route to the Slot Orchestrator devtool. */
	onSkip: () => void | Promise<void>;
	/** Run the auto-config + install chain (preset view). */
	onApplyAutoConfig: () => void | Promise<void>;
	/** Finalise setup + close the overlay (complete view). */
	onFinish: () => void | Promise<void>;
}

// ── Per-view prop structs ──────────────────────────────────────────

export interface WelcomeViewProps {
	copy: GreetingCopy | null;
	busy: boolean;
	callbacks: WizardCallbacks;
}

export interface HardwareViewProps {
	copy: HardwareCopy | null;
	tier: TierDisplay | null;
	gpuName: string | null;
	hasGpu: boolean;
	vramTotalMb: number | null;
	busy: boolean;
	callbacks: WizardCallbacks;
}

export interface PresetViewProps {
	copy: ProfileCopy | null;
	busy: boolean;
	callbacks: WizardCallbacks;
}

export interface InstallingViewProps {
	copy: DownloadsCopy | null;
	recommendations: SlotRecommendation[];
	dispatchedInstalls: Array<{
		installId: string;
		slotId: string;
		status: "running" | "complete" | "failed";
		error?: string | null;
	}>;
	dispatchErrors: Record<string, string>;
	installsRunning: number;
	installsComplete: number;
	installsFailed: number;
	installsTotal: number;
	installsCachedSkippedDownload: number;
}

/**
 * Per-slot save state for the `slot-save` view. One entry per
 * foundation slot the customer is offered (SigLIP HD / Harrier 0.6B /
 * Nemotron 7.6B today; cascade resolver fills the model + sizing
 * fields from kernel side once Sprint 00 lands).
 */
export interface SlotSaveEntryProps {
	/** Stable key — matches `SlotRecommendation.slot_id`. */
	kernelSlotId: string;
	/** Layman slot purpose ("Vision · what Clyffy sees"). */
	purpose: string;
	/** Role description for the slot. */
	tagline: string;
	/** Layman model name ("SigLIP HD"). Optional: omitted until the
	 *  configured backend (local or networked GB10) reports its
	 *  loaded models via the capability endpoint. Tiles render in
	 *  "awaiting-backend" framing when this is absent. */
	modelName?: string;
	/** Short model tagline. Optional — see `modelName`. */
	modelTagline?: string;
	/** Pre-formatted size hint ("~400 MB"). Optional — backend-reported. */
	sizeHint?: string;
	/** Optional tier badge label. */
	tierLabel?: string;
	/** Lifecycle state of the save. */
	state: "ready" | "saving" | "saved" | "error";
	/** Error message when `state === "error"`. */
	errorText?: string;
	/** Optional info-link href. */
	aboutHref?: string;
	/** Lucide-svelte icon name (the view resolves it to a component).
	 *  Anatomy mapping: Eye = vision encoder, Ear = STT, Mic = TTS,
	 *  Sparkles = minion / coder + embedder, BrainCircuit = deep
	 *  reasoning. Extend with care — every name added here must also
	 *  appear in `SlotSaveView.svelte`'s `ICON_MAP`. */
	iconName: "Eye" | "Ear" | "Mic" | "Sparkles" | "BrainCircuit";
	/** CSS variable name for the per-slot accent. */
	accentVar: string;
}

export interface SlotSaveViewProps {
	/** Header copy. */
	title: string;
	/** Subtitle / tagline. */
	subtitle: string;
	/** One entry per slot card to render. */
	slotSaves: SlotSaveEntryProps[];
	/** Whether any save is currently in flight. */
	busy: boolean;
	/** Save callback per slot. */
	onSaveSlot: (kernelSlotId: string) => void | Promise<void>;
	/** Optional: open model picker overlay for one slot. */
	onPickDifferent?: (kernelSlotId: string) => void;
	/** Save every unsaved slot in sequence. */
	onSaveAll: () => void | Promise<void>;
	/** Standard nav callbacks. */
	callbacks: WizardCallbacks;
}

/**
 * Props for the cortex view — anatomy-tile constellation
 * (Brain / Sparkles / Eyes / Ears / Mouth). Same shape as
 * `SlotSaveViewProps` so the existing handlers in
 * `SetupWizardOverlay.svelte` plug in without rewiring; the
 * difference is the wrapping component renders an
 * `AnatomyConstellation` instead of a vertical card list.
 */
export interface CortexViewProps {
	/** Header title. */
	title: string;
	/** Subtitle / tagline. */
	subtitle: string;
	/** One entry per anatomy tile to render. The cortex view picks
	 *  out the entries matching its anatomy → tile-key table
	 *  (`brain` → `chat.brain`, `sparkles` → `rag.embedder`,
	 *  `eyes` → `vision.embedder`, `ears` → `voice.stt`,
	 *  `mouth` → `voice.tts`). (Reconciled 2026-07-08: this doc
	 *  previously said `sparkles` → `minion.shared`, drifted from the
	 *  code.) Extra entries are ignored. */
	slotSaves: SlotSaveEntryProps[];
	/** Whether any apply is currently in flight. */
	busy: boolean;
	/** Apply callback per slot — routes to the endpoint (connect)
	 *  step. Tiles light up from the connected endpoint's capability
	 *  (`clyffyConnection.slots`); they do not install anything. */
	onApplySlot: (kernelSlotId: string) => void | Promise<void>;
	/** Optional: open model picker overlay for one slot. */
	onPickDifferent?: (kernelSlotId: string) => void;
	/** Standard nav callbacks. */
	callbacks: WizardCallbacks;
}

export interface CompleteViewProps {
	copy: CompletionCopy | null;
	busy: boolean;
	callbacks: WizardCallbacks;
}

/**
 * Props for the Clyffy Collab view — the step where the customer
 * brings their Claude API key (or notes their existing Claude Code
 * subscription) so the cortex reasoning router can escalate hard
 * turns to Claude alongside the local llama.cpp brain.
 *
 * Skippable like every other wizard step. State lives in the view
 * itself (key input is one-shot, presence polled from the keyring)
 * so the only props needed are nav callbacks + a busy flag for the
 * usual disable-during-action UX.
 */
export interface ClyffyCollabViewProps {
	busy: boolean;
	callbacks: WizardCallbacks;
}

/**
 * Props for the endpoint (connect) view — where the operator links the
 * standalone app to a Clyffy endpoint (Local / GB10 over the mesh).
 * Copy is the `[connect]` table from the Rust SSOT (`ConnectCopy`);
 * live connection state comes from the `clyffyConnection` rune inside
 * the view (capability-computed, never assumed), so the only props are
 * copy + nav.
 */
export interface EndpointViewProps {
	copy: ConnectCopy | null;
	busy: boolean;
	callbacks: WizardCallbacks;
}

/**
 * Discriminated union of every view's typed prop struct. The
 * dispatcher matches on the active view ID and renders the
 * corresponding component with the matching variant's `props`
 * field. Adding a new view = one variant here + one file under
 * `feature/views/`.
 */
export type ViewProps =
	| { view: "welcome"; props: WelcomeViewProps }
	| { view: "hardware"; props: HardwareViewProps }
	| { view: "preset"; props: PresetViewProps }
	| { view: "endpoint"; props: EndpointViewProps }
	| { view: "cortex"; props: CortexViewProps }
	| { view: "slot-save"; props: SlotSaveViewProps }
	| { view: "installing"; props: InstallingViewProps }
	| { view: "clyffy-collab"; props: ClyffyCollabViewProps }
	| { view: "complete"; props: CompleteViewProps };

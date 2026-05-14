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

export interface CompleteViewProps {
	copy: CompletionCopy | null;
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
	| { view: "installing"; props: InstallingViewProps }
	| { view: "complete"; props: CompleteViewProps };

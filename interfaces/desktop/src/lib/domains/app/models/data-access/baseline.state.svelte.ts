/**
 * @file baselineState — first-boot auto-tuned model chain runner.
 * @module @devpulse/domains/app/models/data-access/baseline
 *
 * Owns the "establish the smooth auto-tuned baseline" flow that fires
 * on first boot without any user click. The kernel-side
 * `auto_configure` Tauri command picks the per-slot recommendations
 * for the detected tier; this rune fans them out through
 * `install_to_slot` (download → scan → assign → load) and tracks
 * per-slot progress so the dashboard's `LiveSubsystemStrip` can
 * surface live status as the chain runs.
 *
 * Extracted from `SetupWizardOverlay.svelte` so the same logic
 * works without the wizard being open. The wizard's `applyAutoConfig`
 * is now a thin wrapper over `baselineState.kick()`.
 *
 * # Locked product directive (feedback_devtools_are_dev_diagnostics 2026-05-14)
 *
 * "The wizard / first-run flow IS this devtool surface, framed for
 * baseline establishment. There is no separate 'customer wizard' —
 * the customer-facing flow is the same auto-tuning running silently
 * before the app ships."
 */

import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import { autoConfigure, installToSlot } from "$lib/sys/bindings/models/index.js";
import { logError, logInfo } from "$lib/sys/logger.js";

const LOG_TARGET = "domains.models.baseline";

/** Recommendation for a single slot — mirrors the kernel `auto_configure` payload. */
export interface BaselineRecommendation {
	slot_id: string;
	model_repo_id: string;
	model_filename: string;
	already_downloaded: boolean;
}

interface AutoConfigPayload {
	tier: string;
	preset_name: string;
	recommendations: BaselineRecommendation[];
	total_vram_needed_mb: number;
	total_download_size_mb: number;
}

/** Phase the chain is currently in. */
export type BaselinePhase = "idle" | "configuring" | "installing" | "ready" | "failed";

class BaselineState {
	/** Current phase. */
	phase = $state<BaselinePhase>("idle");
	/** Tier the kernel picked (e.g. "minimum" / "recommended" / "max"). */
	tier = $state<string | null>(null);
	/** Friendly preset name (e.g. "Recommended"). */
	presetName = $state<string | null>(null);
	/** Recommendations from `auto_configure` — one per slot. */
	recommendations = $state<BaselineRecommendation[]>([]);
	/** Install ids dispatched via `installToSlot`. */
	dispatchedInstallIds = $state<string[]>([]);
	/** Per-slot dispatch error (the `installToSlot` RPC itself failed). */
	dispatchErrors = $state<Record<string, string>>({});
	/** Top-level error string surfaced to the dashboard. */
	error = $state<string | null>(null);
	/** Auto-config response stats. */
	totalVramNeededMb = $state(0);
	totalDownloadSizeMb = $state(0);

	/** Live install progress mirrored from `installState`. */
	dispatchedInstalls = $derived(
		installState.list.filter((i) => this.dispatchedInstallIds.includes(i.installId)),
	);

	/** How many of the dispatched installs are still running. */
	installsRunning = $derived(this.dispatchedInstalls.filter((i) => i.status === "running").length);

	/** How many dispatched installs reported `complete`. */
	installsComplete = $derived(
		this.dispatchedInstalls.filter((i) => i.status === "complete").length,
	);

	/** How many dispatched installs reported `failed`. */
	installsFailed = $derived(this.dispatchedInstalls.filter((i) => i.status === "failed").length);

	/** Total recommendations — denominator for progress UI. */
	installsTotal = $derived(this.recommendations.length);

	/** Recommendations that were already on disk (download skipped). */
	installsCachedSkippedDownload = $derived(
		this.recommendations.filter((r) => r.already_downloaded).length,
	);

	/**
	 * True once every dispatched install has terminated (complete or
	 * failed) AND every recommendation was either dispatched OR landed
	 * in `dispatchErrors`. The caller flips `setup_complete` only when
	 * this transitions true. Stays false until the chain produces a
	 * definitive verdict so we never mark complete on partial progress.
	 */
	allInstallsTerminated = $derived.by(() => {
		if (this.phase !== "installing") return false;
		if (this.installsTotal === 0) return false;
		const dispatchFailures = Object.keys(this.dispatchErrors).length;
		// Every rec must have either been dispatched or failed dispatch.
		if (this.dispatchedInstallIds.length + dispatchFailures < this.installsTotal) {
			return false;
		}
		// Every dispatched install must have terminated.
		if (this.installsRunning > 0) return false;
		return this.installsComplete + this.installsFailed === this.dispatchedInstallIds.length;
	});

	/**
	 * Final verdict the caller acts on once `allInstallsTerminated`
	 * flips true. `ready` means every slot is online (or its load was
	 * a HF cache hit). `partial` means at least one slot failed but
	 * the rest succeeded — the dashboard surfaces the failures and the
	 * dev can retry from the offending tile. `failed` means everything
	 * failed (rare — usually a kernel-side regression).
	 */
	verdict = $derived.by<"ready" | "partial" | "failed" | "pending">(() => {
		if (!this.allInstallsTerminated) return "pending";
		const fails = this.installsFailed + Object.keys(this.dispatchErrors).length;
		if (fails === 0) return "ready";
		if (this.installsComplete > 0) return "partial";
		return "failed";
	});

	/**
	 * Kick the auto-config + install chain. Idempotent — a re-entry
	 * during an in-flight run is a no-op and returns the current
	 * phase. The caller's typical flow:
	 *
	 *   1. On first-boot signal, call `baselineState.kick()`.
	 *   2. UI subscribes to `phase` / `installsRunning` / `installsComplete`
	 *      and renders progress.
	 *   3. When `phase === "ready"`, the caller marks setup complete
	 *      via `markSetupComplete()`.
	 *
	 * # Errors
	 *
	 * The promise resolves whether the chain succeeds or fails. Read
	 * `error` for the surfaced top-level reason; per-slot dispatch
	 * errors land in `dispatchErrors`; per-slot install failures land
	 * via `installState` and reflect through `installsFailed`.
	 */
	async kick(): Promise<BaselinePhase> {
		if (this.phase === "configuring" || this.phase === "installing") {
			logInfo(LOG_TARGET, `kick() ignored — already in phase=${this.phase}`);
			return this.phase;
		}

		this.phase = "configuring";
		this.error = null;
		this.dispatchErrors = {};
		this.dispatchedInstallIds = [];
		this.recommendations = [];

		logInfo(LOG_TARGET, "kick() — calling autoConfigure()");

		const r = await autoConfigure();
		if (r.status === "error") {
			this.error = `Auto-config failed: ${r.error}`;
			this.phase = "failed";
			logError(LOG_TARGET, this.error);
			return this.phase;
		}

		let payload: AutoConfigPayload;
		try {
			payload = JSON.parse(r.data) as AutoConfigPayload;
		} catch (e) {
			this.error = `Could not parse auto-config response: ${(e as Error).message}`;
			this.phase = "failed";
			logError(LOG_TARGET, this.error);
			return this.phase;
		}

		this.tier = payload.tier;
		this.presetName = payload.preset_name;
		this.recommendations = payload.recommendations;
		this.totalVramNeededMb = payload.total_vram_needed_mb;
		this.totalDownloadSizeMb = payload.total_download_size_mb;

		logInfo(
			LOG_TARGET,
			`auto-config tier=${this.tier} preset="${this.presetName}" slots=${this.recommendations.length}`,
		);

		this.phase = "installing";

		await Promise.all(
			this.recommendations.map(async (rec) => {
				const ir = await installToSlot(rec.model_repo_id, rec.model_filename, rec.slot_id, null);
				if (ir.status === "ok") {
					this.dispatchedInstallIds = [...this.dispatchedInstallIds, ir.data];
					logInfo(
						LOG_TARGET,
						`installToSlot dispatched — slot=${rec.slot_id} repo=${rec.model_repo_id} install_id=${ir.data}`,
					);
				} else {
					this.dispatchErrors = {
						...this.dispatchErrors,
						[rec.slot_id]: String(ir.error),
					};
					logError(
						LOG_TARGET,
						`installToSlot dispatch failed — slot=${rec.slot_id} repo=${rec.model_repo_id}: ${ir.error}`,
					);
				}
			}),
		);

		return this.phase;
	}

	/**
	 * Reset to `idle` so the caller can re-kick after a manual fix.
	 * Does NOT cancel in-flight installs (the kernel owns those —
	 * cancel via the downloader's per-install cancel button if needed).
	 */
	reset(): void {
		this.phase = "idle";
		this.error = null;
		this.dispatchErrors = {};
		this.dispatchedInstallIds = [];
		this.recommendations = [];
		this.tier = null;
		this.presetName = null;
		this.totalVramNeededMb = 0;
		this.totalDownloadSizeMb = 0;
	}
}

export const baselineState = new BaselineState();

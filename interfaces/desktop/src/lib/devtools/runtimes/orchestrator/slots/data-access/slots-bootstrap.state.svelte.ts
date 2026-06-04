/**
 * @file slots-bootstrap.state.svelte.ts
 * @module @devpulse/devtools/runtimes/orchestrator/slots/data-access/slots-bootstrap
 *
 * Slots-devtool-owned rune that holds the bootstrap surface area
 * absorbed from the legacy `SetupWizardOverlay`:
 *
 *   - First-run detection (`isFirstRun` / `markSetupComplete`)
 *   - Layman copy + tier display preload
 *   - Auto-config recommendations (no-dispatch — POPULATES only)
 *   - Per-slot save chain with paired-slot fan-out (Harrier ref-count)
 *
 * The rune is data-access only — it never imports UI components.
 * Consumers (the SlotsDevtool Status snippet, the cortex constellation,
 * future bootstrap overlays) read `recommendations`, `slotSaveStates`,
 * `copy`, `tierDisplay`, etc. and call the verb methods.
 *
 * # Why a separate rune from `baselineState`
 *
 * `baselineState` (in `domains/app/models/data-access/`) is the
 * silent-first-boot auto-tuned chain runner — it dispatches every
 * recommendation in parallel and tracks the aggregate verdict.
 *
 * `slotsBootstrapState` is the *interactive* surface: customer
 * clicks Save on one anatomy tile at a time, each click triggers the
 * paired install chain for that slot, and the state tracks per-slot
 * lifecycle (ready / saving / saved / error). The two are deliberately
 * separate so the silent chain can run without dragging in interactive
 * state, and the interactive surface can run without re-invoking the
 * silent fan-out.
 *
 * # Locked product facts
 *
 *   - Customer never picks model size — recommendations come from
 *     the kernel's tier-adaptive selector.
 *   - Harrier 0.6B ref-counts across 5 kernel slots; Sparkles tile
 *     triggers all 5 paired installs. See `slot-anatomy.ts.PAIRED_SLOTS`.
 *   - No multi-step wizard nav — devtool tabs replace it.
 */

import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import {
	autoConfigure,
	getTierDisplay,
	getWizardCopy,
	installToSlot,
	isFirstRun,
	markSetupComplete,
} from "$lib/sys/bindings/models/index.js";
import type { TierDisplay, WizardCopy } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type {
	SlotRecommendation,
	SlotSaveEntry,
	SlotSaveLifecycle,
} from "../util/anatomy.types.js";
import { findLayman, targetsForSave } from "./slot-anatomy.js";

const LOG_TARGET = "devtools.slots.bootstrap";

interface AutoConfigPayload {
	tier: string;
	preset_name: string;
	recommendations: SlotRecommendation[];
	total_vram_needed_mb: number;
	total_download_size_mb: number;
}

class SlotsBootstrapState {
	/** Whether the kernel reports this is the user's first launch. `null`
	 *  before the first `refreshFirstRun()` resolves; `boolean` after. */
	firstRun = $state<boolean | null>(null);

	/** Layman copy loaded from the kernel — used for completion strings,
	 *  download progress copy, etc. */
	copy = $state<WizardCopy | null>(null);

	/** Tier display (tier name + GPU label + VRAM total). Surfaced on the
	 *  devtool header next to the live VRAM bar. */
	tierDisplay = $state<TierDisplay | null>(null);

	/** Last error encountered loading copy / tier / recommendations.
	 *  Cleared when the next call succeeds. */
	error = $state<string | null>(null);

	/** Recommendations from the kernel auto-config pass. Populated lazily
	 *  by `recommend()`; never auto-dispatched. */
	recommendations = $state<SlotRecommendation[]>([]);

	/** Install ids the rune has dispatched via `installToSlot`. Cross-
	 *  referenced against `installState.list` to derive live status. */
	dispatchedInstallIds = $state<string[]>([]);

	/** Per-slot RPC dispatch errors (the `installToSlot` invoke itself
	 *  rejected — distinct from install-side failures which arrive
	 *  through the install event stream). */
	dispatchErrors = $state<Record<string, string>>({});

	/** Per-slot save lifecycle. Keyed by the *trigger* slot id (e.g.
	 *  `rag.embedder` for the Sparkles tile), not the fan-out targets. */
	slotSaveStates = $state<Record<string, SlotSaveLifecycle>>({});

	/** Per-slot save error text — populated when a paired-fan-out install
	 *  reports `failed` or the dispatch RPC rejects. */
	slotSaveErrors = $state<Record<string, string>>({});

	/**
	 * Refresh `firstRun` from the kernel. Called by surfaces that need to
	 * branch on "is this the first launch?" before any UI render.
	 */
	async refreshFirstRun(): Promise<void> {
		const r = await isFirstRun();
		if (r.status === "ok") {
			this.firstRun = r.data;
		} else {
			logError(LOG_TARGET, `refreshFirstRun failed: ${r.error}`);
			this.firstRun = false;
		}
	}

	/**
	 * Mark setup complete with the kernel. Used after the customer has
	 * saved at least one model and acknowledged the bootstrap surface.
	 * Throws on kernel-side failure so the caller can surface the error.
	 */
	async markComplete(): Promise<void> {
		const r = await markSetupComplete();
		if (r.status === "error") {
			logError(LOG_TARGET, `markSetupComplete failed: ${r.error}`);
			throw new Error(`markSetupComplete failed: ${r.error}`);
		}
		this.firstRun = false;
	}

	/**
	 * Load layman copy + tier display in parallel. Idempotent — re-runs
	 * overwrite whatever was loaded before (cheap kernel reads).
	 */
	async loadCopy(): Promise<void> {
		const [copyR, tierR] = await Promise.all([getWizardCopy(), getTierDisplay()]);
		if (copyR.status === "ok") {
			this.copy = copyR.data;
		} else {
			this.error = String(copyR.error);
			logError(LOG_TARGET, `getWizardCopy failed: ${copyR.error}`);
		}
		if (tierR.status === "ok") {
			this.tierDisplay = tierR.data;
		} else {
			logError(LOG_TARGET, `getTierDisplay failed: ${tierR.error}`);
		}
	}

	/**
	 * Pull tier-aware recommendations from the kernel. POPULATES only —
	 * no installs dispatched here. Each customer tile click is what
	 * actually drives the install chain via `saveOneSlot`.
	 *
	 * Re-runs are idempotent and overwrite the previous response. The
	 * kernel re-computes per call (tier may have shifted, e.g. GPU
	 * reattached) so we never cache.
	 */
	async recommend(): Promise<void> {
		const r = await autoConfigure();
		if (r.status === "error") {
			this.error = `Couldn't compute recommendations: ${r.error}`;
			logError(LOG_TARGET, `autoConfigure failed: ${r.error}`);
			return;
		}
		try {
			const payload = JSON.parse(r.data) as AutoConfigPayload;
			this.recommendations = payload.recommendations;
			this.error = null;
			logInfo(
				LOG_TARGET,
				`recommend resolved: ${payload.recommendations.length} slot recommendations (tier=${payload.tier})`,
			);
		} catch (e) {
			this.error = `Couldn't parse auto-config response: ${(e as Error).message}`;
			logError(LOG_TARGET, `autoConfigure parse failed: ${(e as Error).message}`);
		}
	}

	/**
	 * Fire the install chain for a single customer-facing tile. Resolves
	 * the paired-slot targets via `targetsForSave(slotId)` and dispatches
	 * `installToSlot` for each in parallel.
	 *
	 * Lifecycle:
	 *   - Sets `slotSaveStates[slotId] = "saving"` up front so the tile
	 *     reflects state immediately.
	 *   - On all-paired success → `"saved"`.
	 *   - On any-paired dispatch failure → `"error"` with the first
	 *     error message in `slotSaveErrors[slotId]`.
	 *
	 * Per-install completion / failure events flow through
	 * `installState` (mirrored via `dispatchedInstallIds`); this method
	 * captures the dispatch-time verdict. Downstream UI can subscribe to
	 * both for the full picture.
	 */
	async saveOneSlot(slotId: string): Promise<void> {
		const targets = targetsForSave(slotId);
		this.slotSaveStates = { ...this.slotSaveStates, [slotId]: "saving" };
		this.slotSaveErrors = { ...this.slotSaveErrors, [slotId]: "" };

		const results = await Promise.all(
			targets.map(async (target) => {
				const rec = this.recommendations.find((r) => r.slot_id === target);
				if (!rec) {
					return { target, ok: false, error: `No recommendation for ${target}` };
				}
				const ir = await installToSlot(rec.model_repo_id, rec.model_filename, rec.slot_id, null);
				if (ir.status === "ok") {
					this.dispatchedInstallIds = [...this.dispatchedInstallIds, ir.data];
					return { target, ok: true, error: "" };
				}
				return { target, ok: false, error: String(ir.error) };
			}),
		);

		const allOk = results.every((r) => r.ok);
		if (allOk) {
			this.slotSaveStates = { ...this.slotSaveStates, [slotId]: "saved" };
			logInfo(LOG_TARGET, `saveOneSlot(${slotId}) → saved (${targets.length} paired installs)`);
		} else {
			const firstError = results.find((r) => !r.ok)?.error ?? "unknown";
			this.slotSaveStates = { ...this.slotSaveStates, [slotId]: "error" };
			this.slotSaveErrors = { ...this.slotSaveErrors, [slotId]: firstError };
			logError(LOG_TARGET, `saveOneSlot(${slotId}) → error: ${firstError}`);
		}
	}

	/**
	 * Fire `saveOneSlot` for every customer-facing tile that hasn't
	 * already reported `saved`. Used by the "Save all" footer affordance
	 * in the cortex constellation.
	 */
	async saveAllSlots(): Promise<void> {
		const entries = this.slotSaveEntries;
		const unsaved = entries.filter((e) => e.state !== "saved");
		await Promise.all(unsaved.map((e) => this.saveOneSlot(e.kernelSlotId)));
	}

	/**
	 * Derived: one `SlotSaveEntry` per recommendation that has an
	 * anatomy mapping in `SLOT_LAYMAN`. Recommendations without a
	 * mapping (future kernel slots not yet surfaced in UI) are
	 * intentionally dropped — they'll surface as a visible gap in the
	 * constellation rather than render with placeholder copy.
	 */
	slotSaveEntries = $derived<SlotSaveEntry[]>(
		this.recommendations.flatMap((rec) => {
			const layman = findLayman(rec.slot_id);
			if (!layman) return [];
			const state = this.slotSaveStates[rec.slot_id] ?? "ready";
			return [
				{
					kernelSlotId: rec.slot_id,
					purpose: layman.purpose,
					tagline: layman.tagline,
					modelName: deriveModelName(rec),
					modelTagline: deriveModelTagline(rec),
					sizeHint: formatSizeHint(rec.model_size_mb),
					tierLabel: rec.already_downloaded ? "Already on disk" : "Recommended for this machine",
					iconName: layman.iconName,
					accentVar: layman.accentVar,
					aboutHref: layman.aboutHref,
					state,
					errorText: this.slotSaveErrors[rec.slot_id],
				},
			];
		}),
	);

	/** Live install rows for every dispatched install. Cross-references
	 *  `installState.list` so the data stays in sync with the activity
	 *  hud + the dashboard's strip. */
	dispatchedInstalls = $derived(
		installState.list
			.filter((i) => this.dispatchedInstallIds.includes(i.installId))
			.map((i) => ({
				installId: i.installId,
				slotId: i.slotId,
				status: i.status,
				error: i.error,
			})),
	);

	installsRunning = $derived(this.dispatchedInstalls.filter((i) => i.status === "running").length);
	installsComplete = $derived(
		this.dispatchedInstalls.filter((i) => i.status === "complete").length,
	);
	installsFailed = $derived(this.dispatchedInstalls.filter((i) => i.status === "failed").length);
	installsTotal = $derived(this.recommendations.length);
	installsCachedSkippedDownload = $derived(
		this.recommendations.filter((r) => r.already_downloaded).length,
	);
}

/**
 * Derive a customer-facing model name from a kernel recommendation.
 * Preset author's `display_name` wins; absent, falls back to a clean
 * derivation of the HF repo id last segment (drops `-GGUF`,
 * `-Instruct`, version-and-quant suffixes). Never throws — worst case
 * returns the raw `model_repo_id` which is still recognizable.
 */
function deriveModelName(rec: SlotRecommendation): string {
	if (rec.display_name && rec.display_name.length > 0) return rec.display_name;
	const lastSeg = rec.model_repo_id.split("/").pop() ?? rec.model_repo_id;
	return lastSeg
		.replace(/-GGUF$/i, "")
		.replace(/-Instruct(-\d+)?$/i, "")
		.replace(/-v\d+(\.\d+)*$/i, "")
		.replace(/-Base$/i, "")
		.replace(/-/g, " ");
}

/**
 * Derive a one-line layman tagline. Preset author's `display_tagline`
 * wins; absent, falls back to a format-driven sentence
 * ("Runs through llama.cpp." for `.gguf`, "Through the matching
 * native backend." for `.safetensors`, etc.) so the customer always
 * sees engine context.
 */
function deriveModelTagline(rec: SlotRecommendation): string {
	if (rec.display_tagline && rec.display_tagline.length > 0) return rec.display_tagline;
	const fn = rec.model_filename.toLowerCase();
	if (fn.endsWith(".gguf")) return "Runs through llama.cpp.";
	if (fn.endsWith(".safetensors") || fn.endsWith(".safetensors.index.json")) {
		return "Runs through the matching native backend.";
	}
	if (fn.endsWith(".onnx") || fn.endsWith(".bin")) return "Runs through Sherpa / ONNX.";
	return "";
}

function formatSizeHint(mb: number): string {
	if (mb >= 1024) return `~${(mb / 1024).toFixed(1)} GB`;
	return `~${mb} MB`;
}

export const slotsBootstrapState = new SlotsBootstrapState();

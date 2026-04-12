/**
 * @file download-bootstrap.ts
 * @module @devpulse/domains/app/models/features/setup-wizard/download-bootstrap
 *
 * Single-subscription bridge that routes every kernel model-loader event
 * through `wizardState`. Mounted ONCE at root layout so listeners attach
 * during app boot, regardless of whether the overlay is open or not —
 * downloads can start while the overlay is dismissed and still appear
 * live when the user reopens it.
 *
 * Source events (emitted by `systems/devpulse-engine/src/platform/integrations/events.rs`):
 *   - `model:download-started`
 *   - `model:download-progress`
 *   - `model:download-complete`
 *   - `model:download-failed`
 *   - `model:download-cancelled`
 *   - `model:loading-started`
 *   - `model:loading-stage`
 *   - `model:loading-complete`
 *   - `model:loading-failed`
 *
 * Target state (mutated via `wizardState` rune methods only):
 *   - `wizardState.activeDownloads` keyed by `download_id`
 *   - `wizardState.activeLoads` keyed by `slot_id`
 *
 * Every listener is registered ONCE — duplicate registration under HMR
 * is guarded by a module-level `booted` flag. The returned cleanup
 * function is intended for `+layout.svelte` teardown.
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import { logError, logInfo } from "$lib/sys/logger.js";

import type { SlotId } from "../../types/models.types.js";

import { wizardState } from "./wizard.runes.svelte.js";
import { friendlyName, type LoadingStageKind } from "./wizard.types.js";

/**
 * Payload shape for `model:download-started`.
 *
 * Note the mixed casing — the event bridge in `events.rs` emits
 * `download_id`, `repo_id`, `filename` as snake_case and `totalBytes` as
 * camelCase. This struct mirrors the wire format so no rename layer is
 * needed.
 */
interface DownloadStartedPayload {
	download_id: string;
	repo_id: string;
	filename: string;
	totalBytes: number;
}

/** Payload for `model:download-progress`. */
interface DownloadProgressPayload {
	download_id: string;
	bytesDownloaded: number;
	totalBytes: number;
	speedBps: number;
}

/** Payload for `model:download-complete`. */
interface DownloadCompletePayload {
	download_id: string;
	model_id: string;
	filename: string;
}

/** Payload for `model:download-failed`. */
interface DownloadFailedPayload {
	download_id: string;
	error: string;
}

/** Payload for `model:download-cancelled`. */
interface DownloadCancelledPayload {
	download_id: string;
}

/** Payload for `model:loading-started`. */
interface LoadingStartedPayload {
	slot_id: string;
	model_id: string;
}

/** Payload for `model:loading-stage`. Stage is the stringified Rust `LoadingStage` variant. */
interface LoadingStagePayload {
	slot_id: string;
	stage: string;
	progress: number;
}

/** Payload for `model:loading-complete`. */
interface LoadingCompletePayload {
	slot_id: string;
	ram_mb: number;
	vram_mb: number;
}

/** Payload for `model:loading-failed`. */
interface LoadingFailedPayload {
	slot_id: string;
	error: string;
}

/** HMR / double-mount guard. */
let booted = false;
let unlisteners: UnlistenFn[] = [];

/**
 * Normalise the kernel's `LoadingStage` Debug string into the layman stage
 * union the wizard runes consume. The kernel's stage names are:
 *   - `Initializing`, `LoadingModel`, `AllocatingKvCache`, `WarmingUp`, `Ready`
 *   - or `Failed { reason }`
 *
 * Anything we don't explicitly recognise collapses into `"reading"` so the
 * spinner still narrates a sensible layman stage.
 */
function mapStage(raw: string): LoadingStageKind {
	const lower = raw.toLowerCase();
	if (lower.startsWith("failed")) return "failed";
	if (lower.includes("ready")) return "ready";
	if (lower.includes("warm")) return "warmup";
	if (lower.includes("alloc") || lower.includes("kv")) return "memory";
	return "reading";
}

/**
 * Subscribe to every kernel model-loader event and route into
 * `wizardState`. Idempotent — calling twice on the same process is a
 * no-op after the first successful attach.
 *
 * Returns a cleanup function that unsubscribes every listener. The
 * cleanup is safe to call multiple times.
 */
export async function bootstrapDownloadBridge(): Promise<() => void> {
	if (booted) {
		logInfo("download-bridge", "Already booted, skipping duplicate attach");
		return teardown;
	}
	booted = true;

	try {
		const fns: UnlistenFn[] = await Promise.all([
			listen<DownloadStartedPayload>("model:download-started", (event) => {
				const p = event.payload;
				const pendingSlot = "system.pending" as SlotId;
				const existing = wizardState.activeDownloads[p.download_id];
				if (existing) {
					wizardState.updateDownloadProgress(
						p.download_id,
						existing.bytesDownloaded,
						p.totalBytes,
						existing.speedBps,
					);
					logInfo(
						"download-bridge",
						`download-started: ${p.filename} (${p.totalBytes} B) id=${p.download_id}`,
					);
				} else {
					wizardState.trackDownload(p.download_id, pendingSlot, p.filename);
					wizardState.updateDownloadProgress(p.download_id, 0, p.totalBytes, 0);
					logInfo(
						"download-bridge",
						`download-started: ${p.filename} (${p.totalBytes} B) id=${p.download_id} slot=system.pending (until UI trackDownload)`,
					);
				}
			}),

			listen<DownloadProgressPayload>("model:download-progress", (event) => {
				const p = event.payload;
				wizardState.updateDownloadProgress(
					p.download_id,
					p.bytesDownloaded,
					p.totalBytes,
					p.speedBps,
				);
			}),

			listen<DownloadCompletePayload>("model:download-complete", (event) => {
				const p = event.payload;
				wizardState.completeDownload(p.download_id);
				logInfo("download-bridge", `download-complete: ${p.filename}`);
			}),

			listen<DownloadFailedPayload>("model:download-failed", (event) => {
				const p = event.payload;
				wizardState.failDownload(p.download_id, p.error);
				logError("download-bridge", `download-failed: ${p.download_id} — ${p.error}`);
			}),

			listen<DownloadCancelledPayload>("model:download-cancelled", (event) => {
				const p = event.payload;
				wizardState.failDownload(p.download_id, "Cancelled by user");
				logInfo("download-bridge", `download-cancelled: ${p.download_id}`);
			}),

			listen<LoadingStartedPayload>("model:loading-started", (event) => {
				const p = event.payload;
				const slot = p.slot_id as SlotId;
				wizardState.startLoad(slot, p.model_id, friendlyName(p.slot_id));
				logInfo("download-bridge", `loading-started: ${p.slot_id} ← ${p.model_id}`);
			}),

			listen<LoadingStagePayload>("model:loading-stage", (event) => {
				const p = event.payload;
				const slot = p.slot_id as SlotId;
				const stage = mapStage(p.stage);
				const pct = Number.isFinite(p.progress) ? p.progress : null;
				wizardState.updateLoadStage(slot, stage, pct);
			}),

			listen<LoadingCompletePayload>("model:loading-complete", (event) => {
				const p = event.payload;
				const slot = p.slot_id as SlotId;
				wizardState.completeLoad(slot);
				logInfo(
					"download-bridge",
					`loading-complete: ${p.slot_id} (RAM ${p.ram_mb} MB, VRAM ${p.vram_mb} MB)`,
				);
			}),

			listen<LoadingFailedPayload>("model:loading-failed", (event) => {
				const p = event.payload;
				const slot = p.slot_id as SlotId;
				wizardState.failLoad(slot, p.error);
				logError("download-bridge", `loading-failed: ${p.slot_id} — ${p.error}`);
			}),
		]);

		unlisteners = fns;
		logInfo("download-bridge", `Attached ${fns.length} listeners`);
	} catch (e) {
		booted = false;
		logError("download-bridge", `Failed to attach: ${e instanceof Error ? e.message : String(e)}`);
		throw e;
	}

	return teardown;
}

function teardown(): void {
	for (const un of unlisteners) {
		try {
			un();
		} catch (e) {
			logError(
				"download-bridge",
				`Listener teardown error: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}
	unlisteners = [];
	booted = false;
	logInfo("download-bridge", "Detached all listeners");
}

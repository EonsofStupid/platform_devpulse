/**
 * @file bootstrapDownloadBridge — single boot-time entry point.
 * @module @devpulse/domains/app/models/data-access/download-bootstrap
 *
 * Called once by `+layout.svelte` at app boot. Wires up every event
 * listener the model loader needs:
 *
 *   - `download.state.boot()`  — `model:download-{progress,complete,failed,cancelled}`
 *   - `install.state.boot()`   — `model:install-{started,complete,failed}`
 *   - `modelsState.boot()`     — `models` state signal (signal fabric)
 *   - `narrationState.boot()`  — `model:narration`
 *
 * Returns a teardown fn that removes every listener, which the layout
 * stores and runs on layout teardown.
 *
 * **Why one entry point:** every loader subsystem needs a Tauri
 * subscription, but the layout shouldn't have to know about each
 * one. This function is the single contract — call once, get back a
 * detach. Adding a new state rune means extending this function, not
 * adding a new layout import.
 *
 * Lives alongside the other model-loader state runes in
 * `data-access/` so the boot wiring is colocated with the runes it
 * boots — same Nx library-type, same import boundary. The previous
 * home under `feature/setup-wizard/` conflated the boot wiring with
 * a UI surface; the wiring is foundational and runs whether the
 * wizard ever mounts.
 */

import { downloadState } from "$lib/sys/activity-hud/download.state.svelte.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import { modelsState } from "./models.state.svelte.js";
import { narrationState } from "./narration.state.svelte.js";

/**
 * Wire every model-loader listener at app boot. Returns a teardown fn
 * that **currently no-ops** — Svelte 5 runes are app-singleton, so
 * teardown is meaningful only at process exit, which the OS handles
 * for us. The fn shape is preserved so the layout's existing
 * `detachDownloadBridge?.()` cleanup doesn't change.
 *
 * The first-run signal is read by `BootOverlay` from
 * `platformState.modelsFirstRun`, populated atomically with the boot
 * snapshot — not from `isFirstRun()` here, which would race against
 * platform readiness.
 */
export async function bootstrapDownloadBridge(): Promise<() => void> {
	await Promise.all([
		downloadState.boot(),
		installState.boot(),
		modelsState.boot(),
		narrationState.boot(),
	]);

	return () => {
		// Singletons live for the process; nothing to detach mid-session.
		// Reserved for future per-route subscription patterns.
	};
}

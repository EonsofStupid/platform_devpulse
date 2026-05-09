/**
 * @file bootstrapDownloadBridge — single boot-time entry point.
 * @module @devpulse/domains/app/models/feature/setup-wizard/download-bootstrap
 *
 * Called once by `+layout.svelte` at app boot. Wires up every event
 * listener the model loader needs:
 *
 *   - `download.state.boot()`  — `model:download-{progress,complete,failed,cancelled}`
 *   - `install.state.boot()`   — `model:install-{started,complete,failed}`
 *   - `modelsState.boot()`     — `model:slot-status`, `platform:models-status`
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
 */

import { downloadState } from "$lib/sys/activity-hud/download.state.svelte.js";
import { installState } from "$lib/sys/activity-hud/install.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";

/**
 * Wire every model-loader listener at app boot. Returns a teardown fn
 * that **currently no-ops** — Svelte 5 runes are app-singleton, so
 * teardown is meaningful only at process exit, which the OS handles
 * for us. The fn shape is preserved so the layout's existing
 * `detachDownloadBridge?.()` cleanup doesn't change.
 *
 * `wizardState.refreshFirstRun()` is intentionally NOT called here —
 * it would hit `isFirstRun()` before the platform reports ready and
 * log a spurious "Platform not ready" error. `BootOverlay` reads the
 * authoritative first-run signal from `platformState.modelsFirstRun`,
 * which is populated atomically with the boot snapshot.
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

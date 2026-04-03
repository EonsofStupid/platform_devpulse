/**
 * @file Hardware Metrics Service
 * @module @devpulse/domains/app/models/services/hardware
 *
 * Fetches real hardware metrics from the Rust backend via specta bindings.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { commands, type HardwareInfo } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

export type { HardwareInfo } from "$lib/sys/generated/bindings.js";

/** Fetch hardware metrics from backend. Throws on failure. */
export async function fetchHardwareMetrics(): Promise<HardwareInfo> {
	logInfo("models.hardware", "Fetching hardware metrics via IPC...");
	try {
		const result = await commands.getHardwareMetrics();
		if (result.status === "error") {
			throw new Error(result.error);
		}
		logInfo(
			"models.hardware",
			`GPU: ${result.data.gpu_name ?? "none"}, VRAM: ${result.data.gpu_vram_total_mb ?? 0} MB`,
		);
		return result.data;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.hardware", `Hardware metrics fetch FAILED: ${msg}`);
		throw new Error(`Hardware metrics unavailable: ${msg}`);
	}
}

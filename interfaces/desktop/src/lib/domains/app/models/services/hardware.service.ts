/**
 * @file Hardware Metrics Service
 * @module @devpulse/domains/app/models/services/hardware
 *
 * Fetches real hardware metrics from the Rust backend.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { HardwareMetrics } from "../types/models.types.js";

/** Fetch hardware metrics from backend. Throws on failure. */
export async function fetchHardwareMetrics(): Promise<HardwareMetrics> {
	logInfo("models.hardware", "Fetching hardware metrics via IPC...");
	try {
		const metrics = await invoke<HardwareMetrics>("get_hardware_metrics");
		logInfo(
			"models.hardware",
			`GPU: ${metrics.gpuName ?? "none"}, VRAM: ${metrics.gpuVramTotalMb ?? 0} MB`,
		);
		return metrics;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.hardware", `Hardware metrics fetch FAILED: ${msg}`);
		throw new Error(`Hardware metrics unavailable: ${msg}`);
	}
}

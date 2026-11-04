/**
 * @file Hardware Metrics Service
 * @module @devpulse/domains/app/models/data-access/hardware
 *
 * Fetches real hardware metrics from the Rust backend via specta bindings.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { commands, type HardwareInfo } from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";

export type { HardwareInfo } from "#lib/sys/generated/bindings.js";

/** Per-slot VRAM budget entry. Matches Rust VramBudgetInfo from specta (available after cargo build). */
export interface VramBudgetInfo {
	total_vram_mb: number;
	currently_used_mb: number;
	planned_load_mb: number;
	remaining_after_plan_mb: number;
	fits: boolean;
	per_slot: SlotBudgetEntryInfo[];
}

/** Single slot's VRAM contribution. */
export interface SlotBudgetEntryInfo {
	slot_id: string;
	model_name: string;
	vram_estimate_mb: number;
	status: string;
	shared_with: string[];
}

/** Fetch VRAM budget plan from backend. Throws on failure. */
export async function fetchVramBudget(): Promise<VramBudgetInfo> {
	logInfo("models.hardware", "Fetching VRAM budget via IPC...");
	try {
		// Uses invoke directly until bindings are regenerated
		const { invoke } = await import("@tauri-apps/api/core");
		const data = await invoke<VramBudgetInfo>("get_vram_budget");
		return data;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.hardware", `VRAM budget fetch FAILED: ${msg}`);
		throw new Error(`VRAM budget unavailable: ${msg}`);
	}
}

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
			`hardware metrics ok — cpu=${result.data.cpu_name || "empty"} gpu=${result.data.gpu_name ?? "none"} gpuError=${result.data.gpu_error ?? "none"} vram=${result.data.gpu_vram_total_mb ?? 0}MB`,
		);
		return result.data;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.hardware", `Hardware metrics fetch FAILED: ${msg}`);
		throw new Error(`Hardware metrics unavailable: ${msg}`);
	}
}

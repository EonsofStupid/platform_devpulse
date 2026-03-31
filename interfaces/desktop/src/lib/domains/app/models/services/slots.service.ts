/**
 * @file Slots Service
 * @module @devpulse/domains/app/models/services/slots
 *
 * Slot management — assignment, loading, unloading.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { invoke } from "@tauri-apps/api/core";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { SlotInfo } from "../types/models.types.js";

/** Get all registered slots. Throws on failure. */
export async function getSlots(): Promise<SlotInfo[]> {
	logInfo("models.slots", "Fetching slots...");
	try {
		const slots = await invoke<SlotInfo[]>("get_slots");
		logInfo("models.slots", `Got ${slots.length} slots`);
		return slots;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Slots fetch FAILED: ${msg}`);
		throw new Error(`Slots fetch failed: ${msg}`);
	}
}

/** Assign a model to a slot. Throws on failure. */
export async function assignModelToSlot(slotId: string, modelId: string): Promise<void> {
	logInfo("models.slots", `Assigning model ${modelId} to slot ${slotId}`);
	try {
		await invoke("assign_model_to_slot", { slotId, modelId });
		logInfo("models.slots", `Assignment complete: ${slotId} ← ${modelId}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Assignment FAILED: ${msg}`);
		throw new Error(`Failed to assign model: ${msg}`);
	}
}

/** Load a slot's assigned model. Throws on failure. */
export async function loadSlot(slotId: string): Promise<void> {
	logInfo("models.slots", `Loading slot ${slotId}...`);
	try {
		await invoke("load_slot", { slotId });
		logInfo("models.slots", `Slot ${slotId} loaded`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Load FAILED for ${slotId}: ${msg}`);
		throw new Error(`Failed to load ${slotId}: ${msg}`);
	}
}

/** Unload a slot's model. Throws on failure. */
export async function unloadSlot(slotId: string): Promise<void> {
	logInfo("models.slots", `Unloading slot ${slotId}...`);
	try {
		await invoke("unload_slot", { slotId });
		logInfo("models.slots", `Slot ${slotId} unloaded`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Unload FAILED for ${slotId}: ${msg}`);
		throw new Error(`Failed to unload ${slotId}: ${msg}`);
	}
}

/** Check if first run. Throws on failure. */
export async function isFirstRun(): Promise<boolean> {
	try {
		return await invoke<boolean>("is_first_run");
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `First-run check FAILED: ${msg}`);
		throw new Error(`First-run check failed: ${msg}`);
	}
}

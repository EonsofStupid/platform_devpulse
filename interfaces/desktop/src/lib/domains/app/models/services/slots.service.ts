/**
 * @file Slots Service
 * @module @devpulse/domains/app/models/services/slots
 *
 * Slot management — assignment, loading, unloading.
 * Uses specta-generated bindings for type-safe IPC.
 * HARD FAIL — no mock data. Errors surface to UI.
 */

import { commands, type SlotInfo } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

/** Unwrap a specta Result or throw. */
function unwrap<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (result.status === "ok") return result.data;
	throw new Error(result.error);
}

/** Get all registered slots. Throws on failure. */
export async function getSlots(): Promise<SlotInfo[]> {
	logInfo("models.slots", "Fetching slots...");
	try {
		const slots = unwrap(await commands.getSlots());
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
		unwrap(await commands.assignModelToSlot(slotId, modelId));
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
		unwrap(await commands.loadSlot(slotId));
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
		unwrap(await commands.unloadSlot(slotId));
		logInfo("models.slots", `Slot ${slotId} unloaded`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Unload FAILED for ${slotId}: ${msg}`);
		throw new Error(`Failed to unload ${slotId}: ${msg}`);
	}
}

/** Atomically swap the model on a slot (unload → reassign → load). Throws on failure. */
export async function swapSlotModel(slotId: string, newModelId: string): Promise<void> {
	logInfo("models.slots", `Swapping model on ${slotId} → ${newModelId}`);
	try {
		unwrap(await commands.swapSlotModel(slotId, newModelId));
		logInfo("models.slots", `Swap complete: ${slotId} → ${newModelId}`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Swap FAILED for ${slotId}: ${msg}`);
		throw new Error(`Failed to swap model on ${slotId}: ${msg}`);
	}
}

/** Warm a slot — load weights to CPU RAM only. Throws on failure. */
export async function warmSlot(slotId: string): Promise<void> {
	logInfo("models.slots", `Warming slot ${slotId}...`);
	try {
		// Use raw invoke until specta bindings regenerate with warm_slot
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("warm_slot", { slotId });
		logInfo("models.slots", `Slot ${slotId} warmed`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Warm FAILED for ${slotId}: ${msg}`);
		throw new Error(`Failed to warm ${slotId}: ${msg}`);
	}
}

/** Delete a model from disk and registry. Clears slot assignments. Throws on failure. */
export async function deleteModel(modelId: string): Promise<void> {
	logInfo("models.slots", `Deleting model ${modelId}...`);
	try {
		// Use raw invoke until specta bindings regenerate with delete_model
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("delete_model", { modelId });
		logInfo("models.slots", `Model ${modelId} deleted`);
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `Delete FAILED for ${modelId}: ${msg}`);
		throw new Error(`Failed to delete model: ${msg}`);
	}
}

/** Check if first run. Throws on failure. */
export async function isFirstRun(): Promise<boolean> {
	try {
		return unwrap(await commands.isFirstRun());
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("models.slots", `First-run check FAILED: ${msg}`);
		throw new Error(`First-run check failed: ${msg}`);
	}
}

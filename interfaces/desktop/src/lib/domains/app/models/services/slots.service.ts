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

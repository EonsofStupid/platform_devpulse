/**
 * @file Model loader domain types.
 * @module @devpulse/domains/app/models/util/types
 *
 * Wire types come from the auto-generated specta bindings. Domain-only
 * additions (per-slot frontend status, narration shape) live here.
 */

export type {
	HardwareInfo,
	LoadError,
	ModelInfo,
	ModelsReadiness,
	SlotInfo,
	VramBudgetInfo,
} from "#lib/sys/generated/bindings.js";

/**
 * Narration record for a single slot — short Clyffy-voice line surfaced
 * in the chat margin / model event card while the slot transitions.
 */
export interface SlotNarration {
	slotId: string;
	line: string;
	tone: "info" | "success" | "warning" | "error";
	emittedAtMs: number;
}

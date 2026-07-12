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
	ModelsStatusSnapshot,
	SlotInfo,
	VramBudgetInfo,
} from "$lib/sys/generated/bindings.js";

/**
 * Per-slot frontend load status, derived from `model:slot-status` events.
 * Discriminator on `.type` so consumers can `switch (status.type)` cleanly.
 *
 * The engine emits one of these per slot when the slot's lifecycle state
 * changes; the rune store buckets them by slot id.
 */
export type ModelLoadStatus =
	| { type: "loading"; progressPct: number; stage?: string }
	| { type: "ready" }
	| { type: "failed"; error: string }
	| { type: "unloading" };

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

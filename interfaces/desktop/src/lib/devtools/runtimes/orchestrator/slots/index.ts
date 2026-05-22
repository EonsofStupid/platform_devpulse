/**
 * @file devtools/runtimes/orchestrator/slots/index.ts
 * @module @devpulse/devtools/runtimes/orchestrator/slots
 *
 * Slot Orchestrator devtool surface — view + manage slot↔model
 * assignments, per-slot load/unload, VRAM headroom, plus the
 * cortex anatomy bootstrap (Brain / Sparkles / Eyes / Ears / Mouth)
 * absorbed from the legacy SetupWizardOverlay.
 *
 * Layer contract (Nx library-types):
 *   ui/           — AnatomyTile, AnatomyConstellation, SaveSlotCard,
 *                   BootstrapBackdrop (presentational only)
 *   data-access/  — slotsBootstrapState rune, slot-anatomy tables
 *   util/         — anatomy.types
 *   feature/      — SlotsDevtool (orchestrating component)
 */

export {
	findLayman,
	PAIRED_SLOTS,
	SLOT_LAYMAN,
	type SlotLaymanEntry,
	targetsForSave,
} from "./data-access/slot-anatomy.js";
export { slotsBootstrapState } from "./data-access/slots-bootstrap.state.svelte.js";
export { default as SlotsDevtool } from "./feature/SlotsDevtool.svelte";
export { default as AnatomyConstellation } from "./ui/AnatomyConstellation.svelte";
export { type ApplyState, default as AnatomyTile } from "./ui/AnatomyTile.svelte";
export { default as BootstrapBackdrop } from "./ui/BootstrapBackdrop.svelte";
export { default as SaveSlotCard, type SaveState } from "./ui/SaveSlotCard.svelte";
export type {
	SlotRecommendation,
	SlotSaveEntry,
	SlotSaveLifecycle,
} from "./util/anatomy.types.js";

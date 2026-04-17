/**
 * @file knowledge-drops.ts
 * @description Rotating tips during long-running actions (user voice).
 */

import type { ActionId } from "../action-ids.js";

const CATALOG: Record<string, readonly string[]> = {
	models: [
		"Slots hold model weights in RAM or VRAM — loading once and reusing many times is what makes replies fast.",
		"GGUF files are single-file checkpoints; the engine maps layers to CPU or GPU based on your tier.",
		"Warming loads tensors to CPU RAM first so switching models skips cold disk reads.",
	],
	chat: [
		"Sessions group turns per project — the brain reads recent context from the active session.",
		"Export writes the same structured history the engine stores — good for backups or sharing.",
	],
	wizard: [
		"Presets bundle VRAM, model picks, and download hints so you are not tuning twenty knobs on day one.",
		"Hugging Face downloads resume — if something interrupts, pick up where you left off.",
	],
	default: ["The activity HUD shows exactly which call is in flight — no more mystery spinners."],
};

function prefixOf(id: ActionId): string {
	const dot = id.indexOf(".");
	return dot === -1 ? id : id.slice(0, dot);
}

/** Lines to rotate while a long action runs (elapsed > 1s). */
export function knowledgeLinesForAction(id: ActionId): readonly string[] {
	const p = prefixOf(id);
	const lines = CATALOG[p] ?? CATALOG.default;
	return lines;
}

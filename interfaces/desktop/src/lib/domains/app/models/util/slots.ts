/**
 * @file Slot identity helpers — labels, readiness, role membership.
 * @module @devpulse/domains/app/models/util/slots
 *
 * Pure functions over the slot identifiers defined in
 * `kernel/model-loader/config/presets.default.toml` + frontend-only
 * pseudo-slots (e.g. `system.pending` for downloads-without-assignment).
 *
 * Layman labels live here so every consumer that displays a slot in a
 * card / row / badge says the same thing.
 */

import type { ModelLoadStatus } from "./types.js";

/**
 * Layman-friendly display data for a slot. Used by the slot row in
 * `SlotsDevtool`, the chat-side `CortexMemoryStrip`, and the dashboard.
 */
export interface SlotLabel {
	/** Short title (3 words max) — e.g. `"Main AI"`, `"Eyes"`. */
	name: string;
	/** One-line description of the slot's purpose. */
	description: string;
}

const SLOT_LABELS: Record<string, SlotLabel> = {
	"chat.brain": {
		name: "Main AI",
		description: "Talks to you, writes code, answers questions",
	},
	"chat.fast": {
		name: "Quick Brain",
		description: "Handles fast-turn routing and short assistant hops",
	},
	"chat.vision": {
		name: "Vision Reasoning",
		description: "Reasons about screenshots and other visual context",
	},
	"minion.shared": {
		name: "Quick Helper",
		description: "Fast background tasks — summarizing, formatting, lookups",
	},
	"minion.escalation": {
		name: "Deep Thinker",
		description: "Complex analysis when the main AI needs deeper thinking",
	},
	"rag.embedder": {
		name: "Search Engine",
		description: "Finds relevant code and docs so Clyffy knows your project",
	},
	"rag.encoder": {
		name: "Query Encoder",
		description: "Encodes retrieval queries before memory search runs",
	},
	"rag.reranker": {
		name: "Search Refiner",
		description: "Picks the most relevant results from search",
	},
	"vision.embedder": {
		name: "Eyes",
		description: "Sees your screen — helps with errors, layouts, diagrams",
	},
	"voice.tts": {
		name: "Voice",
		description: "Speaks Clyffy's responses out loud",
	},
	"voice.stt": {
		name: "Ears",
		description: "Listens to your voice and converts speech to text",
	},
	"voice.brain": {
		name: "Voice Brain",
		description: "Quick conversational responses for real-time voice chat",
	},
	"voice.wake": {
		name: "Wake Word",
		description: "Listens for the wake phrase so hands-free voice can start",
	},
	"system.pending": {
		name: "Assigning slot…",
		description: "Download in flight, slot assignment pending",
	},
};

/**
 * Get the layman-friendly label for a slot id. Returns `undefined` if
 * the id isn't known so callers can fall back to the raw id.
 */
export function getSlotLabel(slotId: string): SlotLabel | undefined {
	return SLOT_LABELS[slotId];
}

/**
 * Whether a slot's current load status means it can serve inference.
 *
 * Maps the three-state frontend status onto a single boolean — used by
 * the slot-row "Ready" badge, the chat readiness check, and the voice
 * lab's gate before hitting `inferenceGenerate`.
 */
export function isInferenceReady(status: ModelLoadStatus): boolean {
	return status.type === "ready";
}

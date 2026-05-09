/**
 * @file Slot role frames — visual grouping metadata for the model UI.
 * @module @devpulse/domains/app/models/util/roles
 *
 * Slots cluster into four roles in every layman-facing surface
 * (dashboard, devtool, chat strip, models page): `brain`, `encoder`,
 * `voice`, `helpers`. Each role has a label, description, accent
 * color hook, and the ordered list of slot ids it owns.
 *
 * The order in `slots` is the display order — keep tier-relevant slots
 * first within each frame.
 */

export type RoleId = "brain" | "encoder" | "voice" | "helpers";

export interface RoleFrame {
	/** Stable identifier — matches CSS hooks + ROLE_COLORS keys. */
	id: RoleId;
	/** Human-readable role name (rendered as section header). */
	label: string;
	/** One-line role description (rendered to the right of the label). */
	description: string;
	/** Slot ids in this role, in display order. */
	slots: string[];
}

/**
 * Display-order role frames. Brain first (highest stakes), then encoder
 * (search backbone), then voice (loop), then helpers (background work).
 */
export const ROLE_FRAMES: readonly RoleFrame[] = [
	{
		id: "brain",
		label: "Brain",
		description: "The main AI that talks to you",
		slots: ["chat.brain", "chat.fast", "chat.vision"],
	},
	{
		id: "encoder",
		label: "Memory + Search",
		description: "Embedding + reranking for retrieval",
		slots: ["rag.embedder", "rag.encoder", "rag.reranker", "vision.embedder"],
	},
	{
		id: "voice",
		label: "Voice",
		description: "Speech in, speech out",
		slots: ["voice.stt", "voice.tts", "voice.brain", "voice.wake"],
	},
	{
		id: "helpers",
		label: "Helpers",
		description: "Background workers — summarizing, formatting, escalation",
		slots: ["minion.shared", "minion.escalation"],
	},
] as const;

/**
 * Per-role CSS color hook — used by role headers, badges, and the
 * narration card to color-code which subsystem a message came from.
 */
export const ROLE_COLORS: Record<RoleId, string> = {
	brain: "var(--accent-teal-main)",
	encoder: "var(--accent-purple-main)",
	voice: "var(--accent-coral-main)",
	helpers: "var(--text-muted)",
};

/**
 * Reverse lookup: which role frame owns a given slot id, or `null` if
 * the slot doesn't belong to any frame (e.g. `system.pending`).
 */
export function roleForSlot(slotId: string): RoleFrame | null {
	for (const frame of ROLE_FRAMES) {
		if (frame.slots.includes(slotId)) return frame;
	}
	return null;
}

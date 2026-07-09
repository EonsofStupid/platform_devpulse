/**
 * @file slot-anatomy.ts
 * @module @devpulse/devtools/runtimes/orchestrator/slots/data-access/slot-anatomy
 *
 * Frontend-owned anatomy-to-engine-slot translation tables for the
 * cortex constellation rendered in the SlotsDevtool Status tab.
 *
 * Two tables:
 *
 *   - `SLOT_LAYMAN` — anatomy identity per engine slot (icon, accent
 *      var, purpose copy, role tagline). The engine doesn't know what
 *      an "Eye" is; this mapping is strictly a UI-side design choice.
 *      Model NAME + model TAGLINE are NOT in this table — those live
 *      on each `SlotRecommendation` (`display_name`, `display_tagline`)
 *      so the preset author owns them in
 *      the engine's `config/presets.default.toml`.
 *
 *   - `PAIRED_SLOTS` — slots that ship paired and must save together.
 *      Harrier 0.6B ref-counts on the BackendPool (one 1.1 GB copy
 *      serves all 5 slots) but EACH engine slot needs its own
 *      symlink for `Path::exists` probes by downstream consumers. So
 *      clicking Save on the Sparkles tile (`rag.embedder`) fires the
 *      install chain for every Harrier-served slot. Memory + disk
 *      hold ONE copy thanks to the pool; symlinks fan out.
 *
 * Locked product facts driving this file:
 *
 *   - Four models only: SigLIP HD / Harrier 0.6B / Nemotron-Nano-9B-v2
 *     / Sherpa. No customer-facing variant picker.
 *   - Harrier 0.6B ref-counts across rag.embedder + rag.encoder +
 *     chat.suggest + minion.embedder + minion.encoder. The trigger
 *     tile is `rag.embedder` (the "Sparkles" anatomy slot).
 *
 * Verbatim layman strings are owned here so the engine-owned
 * `WizardCopy` payload stays focused on its own phases (greeting,
 * hardware, downloads, completion); anatomy purpose lines are
 * UI-design copy, not engine copy.
 */

/**
 * Per-slot anatomy identity. Slot ids MUST match
 * the engine's `config/slots.default.toml` verbatim.
 * `accentVar` must reference a generated token from
 * `interfaces/desktop/src/lib/design/generated/token-manifest.json`
 * (real names carry `-main` / `-fill` / `-glow` suffixes; cards point
 * at `-main` because the surface gradient mixes the main hue).
 */
export interface SlotLaymanEntry {
	purpose: string;
	tagline: string;
	iconName: "Eye" | "Ear" | "Mic" | "Sparkles" | "BrainCircuit";
	accentVar: string;
	aboutHref?: string;
}

export const SLOT_LAYMAN: Record<string, SlotLaymanEntry> = {
	"vision.embedder": {
		purpose: "Eyes · what Clyffy sees",
		tagline: "Encodes screenshots and uploads so Clyffy can reason about images.",
		iconName: "Eye",
		accentVar: "--accent-cyan-main",
	},
	"voice.stt": {
		purpose: "Ears · what Clyffy hears",
		tagline: "Listens to your microphone and turns speech into text.",
		iconName: "Ear",
		accentVar: "--accent-purple-main",
	},
	"voice.tts": {
		purpose: "Mouth · how Clyffy speaks",
		tagline: "Turns Clyffy's replies into natural-sounding speech.",
		iconName: "Mic",
		accentVar: "--accent-hotpink-main",
	},
	"rag.embedder": {
		purpose: "Sparkles · Clyffy's indexing brain",
		tagline:
			"Encodes + embeds every project file so retrieval finds the right chunks before the long-think wakes.",
		iconName: "Sparkles",
		accentVar: "--accent-teal-main",
	},
	"chat.brain": {
		purpose: "Brain · the long-think reasoner",
		tagline: "Handles the heavy reasoning once the indexing brain has set the table.",
		iconName: "BrainCircuit",
		accentVar: "--accent-blue-main",
	},
};

/**
 * Look the anatomy identity up for a slot id. Returns `undefined` for
 * any engine slot not in the constellation (e.g. future slots the
 * frontend hasn't mapped yet) — callers should treat that as a signal
 * to skip the tile rather than render a half-broken card.
 */
export function findLayman(slotId: string): SlotLaymanEntry | undefined {
	return SLOT_LAYMAN[slotId];
}

/**
 * Slots that ship paired and must save together. Clicking Save on the
 * Sparkles tile (`rag.embedder`) fires the install chain for EVERY
 * Harrier-served slot: rag.embedder + rag.encoder + chat.suggest +
 * minion.embedder + minion.encoder. Harrier 0.6B ref-counts on the
 * BackendPool so memory + disk hold ONE copy, but each engine slot
 * needs its own symlink for `Path::exists` probes by the retrieval
 * consumer.
 *
 * Extended from the previous wizard's `{ "rag.embedder": ["rag.embedder",
 * "rag.encoder"] }` to cover the full five Harrier slots per the
 * locked memory rule `project_harrier_tier_adaptive`.
 *
 * The lookup table is keyed by the customer-facing trigger slot. The
 * `chat.brain` slot is intentionally NOT here — that's Nemotron, a
 * distinct GGUF download, not a Harrier ref-count target.
 */
export const PAIRED_SLOTS: Record<string, readonly string[]> = {
	"rag.embedder": [
		"rag.embedder",
		"rag.encoder",
		"chat.suggest",
		"minion.embedder",
		"minion.encoder",
	],
};

/**
 * Resolve the install-chain target slots for a customer-facing tile
 * click. `rag.embedder` returns all five Harrier slots; any other
 * slot returns `[slotId]` (self only).
 */
export function targetsForSave(slotId: string): readonly string[] {
	return PAIRED_SLOTS[slotId] ?? [slotId];
}

/**
 * @file rro-narrations.ts
 * @description Layman + learning narrations mirrored from
 * systems/devpulse-engine/ip/signals.narrations.yaml (rro.* only).
 *
 * This is a hand-synced mirror, not a generated file. When the YAML changes,
 * update this file. Kept close to the UI so devtools can render narration
 * without a Tauri round-trip.
 */

export interface Narration {
	/** Short phrasings — what an end user sees. */
	layman: string[];
	/** Educational copy — why this state matters, what to watch. */
	learning?: string[];
}

/** Pick a deterministic layman phrasing given a seed (prevents flicker). */
export function pickLayman(n: Narration, seed = 0): string {
	if (n.layman.length === 0) return "";
	return n.layman[Math.abs(seed) % n.layman.length];
}

export const RRO_STATE_NARRATIONS: Record<string, Narration> = {
	idle: {
		layman: ["clyffy is resting", "nothing on the stove"],
	},
	gathering: {
		layman: [
			"rounding up context",
			"performing the dark arts for context",
			"digging through the vault",
			"asking the scouts to look around",
		],
		learning: ["watch what the scout pulls — prompt quality is decided here, not in the answer"],
	},
	processing: {
		layman: [
			"sorting through what was found",
			"stacking the pieces in order",
			"making sense of the haul",
		],
	},
	ruminating: {
		layman: [
			"thinking this through properly",
			"letting the gears turn",
			"weighing the options",
			"clyffy is pacing the room",
		],
		learning: [
			"rumination is the pause before acting — this is where senior instincts live",
			"if rumination runs long, something is unclear in the context, not in the question",
		],
	},
	ready: {
		layman: ["context is locked and loaded", "ready to act"],
	},
	purged: {
		layman: ["threw out the old context", "starting fresh"],
		learning: [
			"when context goes stale, the fastest fix is purge and regather — not fight through it",
		],
	},
	forked: {
		layman: ["branched into alternatives", "holding two paths open"],
		learning: [
			"forks let clyffy compare approaches without committing — same trick you use when you're unsure",
		],
	},
};

export const RRO_DEPTH_NARRATIONS: Record<string, Narration> = {
	shallow: {
		layman: ["quick answer mode", "snap judgment"],
		learning: ["shallow skips rumination — fine for trivia, wrong for design decisions"],
	},
	normal: {
		layman: ["standard deliberation"],
	},
	deep: {
		layman: ["full rumination", "clyffy is pacing the room"],
		learning: ["deep rumination costs latency but catches edge cases shallow misses"],
	},
};

/** The Brain is the knowledge-store narration. Not from the YAML — devtool copy. */
export const BRAIN_NARRATION = {
	headline: "This is where Clyffy remembers.",
	body: "Search pulls from here. Decisions, patterns, learnings, and anti-patterns all live in the Brain. The vector store is just the index — the meaning is stored as a graph.",
	namespaces: {
		System: {
			label: "Engine state",
			desc: "Boot records, reasoning state, internal checkpoints.",
		},
		User: {
			label: "Your memory",
			desc: "Sessions, preferences, concepts, corrections you've taught.",
		},
		Global: {
			label: "Shared knowledge",
			desc: "Cross-project patterns, dev profile, rejections, learnings.",
		},
	},
	knowledgeTables: {
		context: "Active sprint, blockers, current state.",
		decisions: "Project decisions and trade-offs.",
		patterns: "Known best practices and templates.",
		learnings: "Confirmed approaches, worth repeating.",
		rejections: "What NOT to do — hard-earned anti-patterns.",
		preferences: "Your style, tone, communication rules.",
		memories: "Long-term notes Clyffy keeps about you.",
		corrections: "Cases where you corrected Clyffy.",
	} as Record<string, string>,
};

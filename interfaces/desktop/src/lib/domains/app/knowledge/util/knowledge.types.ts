/**
 * @file Knowledge library types — generalized, no kernel vocabulary.
 * @module @devpulse/domains/app/knowledge/util
 */

/**
 * Entry type discriminant.
 *
 * - `dyk` / `kdrop` / `frust` / `insight` — title + body cards
 * - `gloss` — term + definition lookups
 * - `quiz` — single-choice radio-group with optional explanations
 * - `rank` — preference reorder (no correct answer)
 * - `order` — sequence reorder (has a correct answer)
 */
export type KnowledgeEntryType =
	| "dyk"
	| "kdrop"
	| "frust"
	| "insight"
	| "gloss"
	| "quiz"
	| "rank"
	| "order";

/** Expertise tier. */
export type KnowledgeTier = "beginner" | "intermediate" | "advanced";

/** Raw entry from the backend — payload is a JSON string. */
interface KnowledgeEntryRaw {
	id: string;
	entryType: KnowledgeEntryType;
	tool: string | null;
	category: string;
	tier: KnowledgeTier;
	payloadJson: string;
	tags: string[];
	added: string;
}

/** Parsed entry with typed payload. */
export interface KnowledgeEntry {
	id: string;
	entryType: KnowledgeEntryType;
	tool: string | null;
	category: string;
	tier: KnowledgeTier;
	payload:
		| DykPayload
		| KdropPayload
		| FrustPayload
		| InsightPayload
		| GlossPayload
		| QuizPayload
		| RankPayload
		| OrderPayload;
	tags: string[];
	added: string;
}

/** Parse a raw backend entry into a typed entry. */
export function parseKnowledgeEntry(raw: KnowledgeEntryRaw): KnowledgeEntry {
	return {
		...raw,
		payload: JSON.parse(raw.payloadJson),
	};
}

export interface DykPayload {
	title: string;
	body: string;
}

export interface KdropPayload {
	title: string;
	body: string;
}

export interface FrustPayload {
	title: string;
	body: string;
}

export interface InsightPayload {
	title: string;
	body: string;
}

export interface GlossPayload {
	term: string;
	definition: string;
}

/** One choice in a multiple-choice quiz. */
export interface QuizChoice {
	id: string;
	label: string;
	/** Whether this choice is the "correct" answer (omit for opinion prompts). */
	isCorrect?: boolean;
	/** Explanation shown after the user picks this choice. */
	explanation?: string;
}

export interface QuizPayload {
	question: string;
	choices: QuizChoice[];
}

/** One item in a rank / order payload. */
export interface OrderingItem {
	id: string;
	label: string;
	detail?: string;
}

/** Preference-rank payload — no correct answer. */
export interface RankPayload {
	prompt: string;
	items: OrderingItem[];
}

/** Sequence-order payload — has a correct answer for validation. */
export interface OrderPayload {
	prompt: string;
	items: OrderingItem[];
	correctOrderIds: string[];
}

/** User reaction to an entry. */
export type KnowledgeReaction = "helpful" | "not_helpful";

// ── Payload narrowing ────────────────────────────────────

/** Type guard: entry has title+body payload (dyk, kdrop, frust, insight). */
export function hasTitleBody(
	entry: KnowledgeEntry,
): entry is KnowledgeEntry & { payload: DykPayload } {
	return (
		entry.entryType === "dyk" ||
		entry.entryType === "kdrop" ||
		entry.entryType === "frust" ||
		entry.entryType === "insight"
	);
}

/** Type guard: entry has term+definition payload (gloss). */
export function isGlossary(
	entry: KnowledgeEntry,
): entry is KnowledgeEntry & { payload: GlossPayload } {
	return entry.entryType === "gloss";
}

/** Type guard: entry is a multiple-choice quiz. */
export function isQuiz(entry: KnowledgeEntry): entry is KnowledgeEntry & { payload: QuizPayload } {
	return entry.entryType === "quiz";
}

/** Type guard: entry is a preference ranking. */
export function isRank(entry: KnowledgeEntry): entry is KnowledgeEntry & { payload: RankPayload } {
	return entry.entryType === "rank";
}

/** Type guard: entry is a sequence ordering. */
export function isOrder(
	entry: KnowledgeEntry,
): entry is KnowledgeEntry & { payload: OrderPayload } {
	return entry.entryType === "order";
}

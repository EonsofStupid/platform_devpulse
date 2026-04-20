/**
 * @file Knowledge library types — generalized, no kernel vocabulary.
 * @module @devpulse/domains/app/knowledge/util
 */

/** Entry type discriminant. */
export type KnowledgeEntryType = "dyk" | "kdrop" | "frust" | "insight" | "gloss";

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
	payload: DykPayload | KdropPayload | FrustPayload | InsightPayload | GlossPayload;
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

/** User reaction to an entry. */
export type KnowledgeReaction = "helpful" | "not_helpful";

// ── Payload narrowing ────────────────────────────────────

/** Type guard: entry has title+body payload (dyk, kdrop, frust, insight). */
export function hasTitleBody(
	entry: KnowledgeEntry,
): entry is KnowledgeEntry & { payload: DykPayload } {
	return entry.entryType !== "gloss";
}

/** Type guard: entry has term+definition payload (gloss). */
export function isGlossary(
	entry: KnowledgeEntry,
): entry is KnowledgeEntry & { payload: GlossPayload } {
	return entry.entryType === "gloss";
}

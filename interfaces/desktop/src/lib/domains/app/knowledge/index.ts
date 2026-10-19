/**
 * @file Knowledge domain public API.
 * @module @devpulse/domains/app/knowledge
 */

// Data access
export {
	getKnowledgeEntry,
	type KnowledgeSyncResult,
	knowledgeState,
	recordReaction,
	syncKnowledgeFromRemote,
} from "./data-access/index.js";

// Feature components
export { default as KnowledgeDeck } from "./feature/knowledge-deck/KnowledgeDeck.svelte";
export { default as ClyffyKnowledgeNudge } from "./feature/knowledge-nudge/ClyffyKnowledgeNudge.svelte";
export { default as KnowledgeTerm } from "./feature/knowledge-term/KnowledgeTerm.svelte";
export { default as KnowledgeTermStrip } from "./feature/knowledge-term/KnowledgeTermStrip.svelte";

// Types
export type {
	DykPayload,
	FrustPayload,
	GlossPayload,
	InsightPayload,
	KdropPayload,
	KnowledgeEntry,
	KnowledgeEntryType,
	KnowledgeReaction,
	KnowledgeTier,
} from "./util/index.js";

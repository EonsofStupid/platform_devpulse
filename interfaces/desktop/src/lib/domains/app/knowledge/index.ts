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

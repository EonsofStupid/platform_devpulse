/**
 * @file Knowledge Blocks Barrel
 * @module @devpulse/design/blocks/knowledge
 *
 * The strong base pattern every knowledge surface composes off of.
 * `KnowledgeCard` is the foundation primitive — every variant
 * (`KnowledgeDykCard`, `KnowledgeKdropCard`, `KnowledgeMultipleChoiceCard`,
 * `KnowledgeRearrangeCard`, `KnowledgeOrderingCard`) wraps it with
 * type-specific body + actions. `KnowledgeDeck` (one phase up)
 * dispatches a variant from a context tag + a fetched entry.
 *
 * Surfaces that consume from here (downstream):
 *
 * - chat empty state — `KnowledgeDeck context="chat-idle"`
 * - wizard phases    — `KnowledgeDeck context="wizard-{phase}"`
 * - hover nudges     — `ClyffyKnowledgeNudge mode="hover"` (legacy
 *   block — will be refactored to use these primitives in Phase 4)
 * - devtools tiles   — `ClyffyKnowledgeNudge mode="hover"` ditto
 */

export {
	default as KnowledgeCard,
	type KnowledgeCardAccent,
} from "./KnowledgeCard.svelte";
export { default as KnowledgeDeck } from "./KnowledgeDeck.svelte";
export { default as KnowledgeDykCard } from "./KnowledgeDykCard.svelte";
export { default as KnowledgeFrustCard } from "./KnowledgeFrustCard.svelte";
export { default as KnowledgeGlossCard } from "./KnowledgeGlossCard.svelte";
export { default as KnowledgeInsightCard } from "./KnowledgeInsightCard.svelte";
export { default as KnowledgeKdropCard } from "./KnowledgeKdropCard.svelte";
export {
	default as KnowledgeMultipleChoiceCard,
	type KnowledgeChoice,
} from "./KnowledgeMultipleChoiceCard.svelte";
export { default as KnowledgeOrderCard } from "./KnowledgeOrderCard.svelte";
export {
	default as KnowledgeOrderingCard,
	type KnowledgeOrderingIntent,
	type KnowledgeOrderingItem,
} from "./KnowledgeOrderingCard.svelte";
export { default as KnowledgeQuizCard } from "./KnowledgeQuizCard.svelte";
export { default as KnowledgeRankCard } from "./KnowledgeRankCard.svelte";
export { default as KnowledgeTerm } from "./KnowledgeTerm.svelte";
export { default as KnowledgeTermStrip } from "./KnowledgeTermStrip.svelte";

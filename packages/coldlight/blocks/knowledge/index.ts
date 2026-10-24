/**
 * @file Knowledge Blocks Barrel
 * @module @devpulse/design/blocks/knowledge
 *
 * The presentational base every knowledge surface composes: the
 * `KnowledgeCard` shell (snippets for mascot, heading, body, actions)
 * and the two interactive card patterns built on it. They take their
 * content as props and import nothing from the app.
 *
 * The knowledge domain composes them: its `ui/knowledge-cards` (one card
 * per entry type) and `feature/knowledge-deck` / `feature/knowledge-term`
 * (`domains/app/knowledge`).
 */

export {
	default as KnowledgeCard,
	type KnowledgeCardAccent,
} from "./KnowledgeCard.svelte";
export {
	default as KnowledgeMultipleChoiceCard,
	type KnowledgeChoice,
} from "./KnowledgeMultipleChoiceCard.svelte";
export {
	default as KnowledgeOrderingCard,
	type KnowledgeOrderingIntent,
	type KnowledgeOrderingItem,
} from "./KnowledgeOrderingCard.svelte";

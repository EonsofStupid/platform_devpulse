<!--
	@component ChatEmptyKnowledge
	@module domains/chat

	The chat thread's empty state: `KnowledgeDeck` pulling the chat-tagged
	catalog with `chat:empty` scope, rotating every 60 s while idle so users
	browsing the empty pane see variety. Restored from ColdLight's
	`ChatThread` (removed in plan 0006 C1a, 3604a2b2), which now takes this as
	its `empty` snippet: ColdLight imports nothing from the app.
-->
<script lang="ts">
import { KnowledgeDeck } from "$lib/domains/app/knowledge/index.js";

// Empty-state context frame — pushed onto knowledgeContext when
// the thread is empty so KnowledgeDeck pulls the chat-tagged
// catalog with `chat:empty` scope. When a message arrives, the
// deck unmounts, the frame pops, and the regular thread takes
// over. Ambient rotation every 60s while idle so users browsing
// the empty pane see variety.
const EMPTY_CONTEXT = {
	id: "chat-thread-empty",
	tool: "chat",
	scope: "chat:empty",
	preferred: "dyk" as const,
};
</script>

<KnowledgeDeck context={EMPTY_CONTEXT} refreshIntervalMs={60000} />

<!--
	@block KnowledgeOrderCard
	@module @devpulse/design/blocks/knowledge

	Entry-backed wrapper around `KnowledgeOrderingCard intent="sequence"`.
	Takes a `KnowledgeEntry` with an `OrderPayload`, forwards
	prompt + items + correctOrderIds, accepts the user's order
	via `onAccept` (caller can validate against
	`entry.payload.correctOrderIds` if it's a didactic surface).
-->
<script lang="ts">
import type { KnowledgeEntry, OrderPayload } from "$lib/domains/app/knowledge/util/index.js";
import KnowledgeOrderingCard from "./KnowledgeOrderingCard.svelte";

interface Props {
	entry: KnowledgeEntry & { payload: OrderPayload };
	onAccept?: (entryId: string, orderedIds: string[]) => void;
	onDismiss?: () => void;
	live?: "off" | "polite" | "assertive";
}

let { entry, onAccept, onDismiss, live = "polite" }: Props = $props();
</script>

<KnowledgeOrderingCard
	id={entry.id}
	prompt={entry.payload.prompt}
	items={entry.payload.items}
	intent="sequence"
	{live}
	onAccept={(orderedIds) => onAccept?.(entry.id, orderedIds)}
	{onDismiss}
/>

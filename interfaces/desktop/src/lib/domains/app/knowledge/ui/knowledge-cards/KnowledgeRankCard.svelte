<!--
	@block KnowledgeRankCard
	@module @devpulse/design/blocks/knowledge

	Entry-backed wrapper around `KnowledgeOrderingCard intent="preference"`.
	Takes a `KnowledgeEntry` with a `RankPayload`, forwards prompt
	+ items, accepts the user's preferred order via `onAccept`.

	Distinct from `KnowledgeOrderCard` (sequence ordering) — this
	one is for preference capture where there's no correct answer.
-->
<script lang="ts">
import { KnowledgeOrderingCard } from "@devpulse/coldlight/blocks/knowledge";
import type { KnowledgeEntry, RankPayload } from "../../util/index.js";

interface Props {
	entry: KnowledgeEntry & { payload: RankPayload };
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
	intent="preference"
	{live}
	onAccept={(orderedIds) => onAccept?.(entry.id, orderedIds)}
	{onDismiss}
/>

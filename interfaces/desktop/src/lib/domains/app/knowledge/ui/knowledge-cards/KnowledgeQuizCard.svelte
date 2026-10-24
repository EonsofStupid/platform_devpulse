<!--
	@block KnowledgeQuizCard
	@module @devpulse/design/blocks/knowledge

	Entry-backed wrapper around `KnowledgeMultipleChoiceCard`.
	Takes a `KnowledgeEntry` with a `QuizPayload`, forwards
	question + choices to the underlying card, and routes
	dismiss/choose through the kernel reaction handler.

	Authored separately from `KnowledgeMultipleChoiceCard` so
	the latter stays usable as a pure direct-props block for
	one-off quiz authoring outside the kernel catalog (test
	harnesses, devtool diagnostics, etc.).
-->
<script lang="ts">
import { KnowledgeMultipleChoiceCard } from "@devpulse/coldlight/blocks/knowledge";
import type { KnowledgeEntry, QuizPayload } from "../../util/index.js";

interface Props {
	entry: KnowledgeEntry & { payload: QuizPayload };
	onChoose?: (entryId: string, choiceId: string) => void;
	onDismiss?: () => void;
	live?: "off" | "polite" | "assertive";
}

let { entry, onChoose, onDismiss, live = "polite" }: Props = $props();
</script>

<KnowledgeMultipleChoiceCard
	id={entry.id}
	prompt={entry.payload.question}
	choices={entry.payload.choices}
	{live}
	onChoose={(choiceId) => onChoose?.(entry.id, choiceId)}
	{onDismiss}
/>

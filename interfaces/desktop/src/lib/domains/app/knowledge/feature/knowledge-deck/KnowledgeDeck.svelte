<!--
	@block KnowledgeDeck
	@module @devpulse/design/blocks/knowledge

	The orchestrator that turns a context tag into a rendered
	knowledge surface. Consumers don't pick a variant card by
	hand — they mount `<KnowledgeDeck context={frame} />` and
	the deck fetches from the kernel catalog (affinity-weighted,
	sporadic, cooldown-gated), dispatches to the right variant
	(DykCard / KdropCard / GlossCard), and forwards
	reaction/dismiss back to the kernel.

	# Lifecycle

	On mount:
	1. Push the supplied frame onto `knowledgeContext` (or use
	   `current` if frame is unset).
	2. Call `fetchNext(preferredType)` on `knowledgeState`.
	3. When an entry resolves, dispatch the matching variant.
	4. On unmount, pop the frame off the context stack.

	# Sporadic re-roll

	The deck calls `knowledgeContext.noteShown(entry.id)` after
	the fetch resolves, so the next deck mount under the same
	context skips the same entry. Combined with the kernel
	`cooldown_secs` (1h default), the user sees variety.

	# Auto-refresh

	When `refreshIntervalMs > 0`, the deck silently fetches
	the next entry on a timer. Useful for ambient surfaces
	(chat empty splash that rotates a fresh tip every minute);
	leave unset for one-shot surfaces (wizard phase).

	# Interactive variants

	The deck handles only entry-backed surfaces (dyk/kdrop/gloss).
	Interactive variants (`KnowledgeMultipleChoiceCard`,
	`KnowledgeOrderingCard`) take direct props and don't go
	through the kernel catalog; mount them directly when you
	want to author a single quiz or ordering surface in-place.
-->
<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { logError } from "$lib/sys/logger.js";
import { knowledgeState } from "../../data-access/knowledge.state.svelte.js";
import {
	type KnowledgeContextFrame,
	knowledgeContext,
} from "../../data-access/knowledge-context.svelte.js";
import {
	KnowledgeDykCard,
	KnowledgeFrustCard,
	KnowledgeGlossCard,
	KnowledgeInsightCard,
	KnowledgeKdropCard,
	KnowledgeOrderCard,
	KnowledgeQuizCard,
	KnowledgeRankCard,
} from "../../ui/knowledge-cards/index.js";
import {
	hasTitleBody,
	isGlossary,
	isOrder,
	isQuiz,
	isRank,
	type KnowledgeEntryType,
} from "../../util/index.js";

interface Props {
	/**
	 * Context frame for this deck mount. When omitted, the deck
	 * uses whatever's already on top of `knowledgeContext`. When
	 * provided, the deck pushes this frame on mount and pops it
	 * on destroy.
	 */
	context?: KnowledgeContextFrame;
	/**
	 * Preferred entry type. Overrides the frame's `preferred`.
	 * Defaults to `dyk` (cheap, frequent, well-stocked).
	 */
	preferred?: KnowledgeEntryType;
	/**
	 * When > 0, re-fetch a fresh entry every N ms. Set 0 (default)
	 * for one-shot surfaces. Recommended values: 0 (one-shot) or
	 * 60000 (gentle ambient rotation).
	 */
	refreshIntervalMs?: number;
}

let { context, preferred = "dyk", refreshIntervalMs = 0 }: Props = $props();

const entry = $derived(knowledgeState.current);

let refreshTimer: ReturnType<typeof setInterval> | null = null;
let popFn: (() => void) | null = null;

async function refresh(): Promise<void> {
	const frame = knowledgeContext.enrichContext();
	const tool = frame?.tool;
	const targetType = frame?.preferred ?? preferred;
	try {
		await knowledgeState.fetchNext(targetType, tool);
		if (knowledgeState.current) {
			knowledgeContext.noteShown(knowledgeState.current.id);
		}
	} catch (e) {
		logError("knowledge.deck", `fetchNext failed: ${String(e)}`);
	}
}

onMount(() => {
	if (context) {
		popFn = knowledgeContext.push(context);
	}
	void refresh();
	if (refreshIntervalMs > 0) {
		refreshTimer = setInterval(() => {
			void refresh();
		}, refreshIntervalMs);
	}
});

onDestroy(() => {
	if (refreshTimer !== null) {
		clearInterval(refreshTimer);
		refreshTimer = null;
	}
	popFn?.();
	popFn = null;
});

async function onHelpful(): Promise<void> {
	await knowledgeState.react("helpful");
	void refresh();
}

async function onNotHelpful(): Promise<void> {
	await knowledgeState.react("not_helpful");
	void refresh();
}

function onDismiss(): void {
	knowledgeState.dismiss();
	void refresh();
}
</script>

{#if entry}
	{#if entry.entryType === "dyk" && hasTitleBody(entry)}
		<KnowledgeDykCard {entry} {onHelpful} {onNotHelpful} {onDismiss} />
	{:else if entry.entryType === "kdrop" && hasTitleBody(entry)}
		<KnowledgeKdropCard {entry} {onHelpful} {onNotHelpful} {onDismiss} />
	{:else if entry.entryType === "gloss" && isGlossary(entry)}
		<KnowledgeGlossCard {entry} mascot {onDismiss} />
	{:else if entry.entryType === "frust" && hasTitleBody(entry)}
		<KnowledgeFrustCard {entry} {onHelpful} {onNotHelpful} {onDismiss} />
	{:else if entry.entryType === "insight" && hasTitleBody(entry)}
		<KnowledgeInsightCard {entry} {onHelpful} {onNotHelpful} {onDismiss} />
	{:else if entry.entryType === "quiz" && isQuiz(entry)}
		<KnowledgeQuizCard {entry} {onDismiss} />
	{:else if entry.entryType === "rank" && isRank(entry)}
		<KnowledgeRankCard {entry} {onDismiss} />
	{:else if entry.entryType === "order" && isOrder(entry)}
		<KnowledgeOrderCard {entry} {onDismiss} />
	{/if}
{/if}

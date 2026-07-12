<!--
	@block ClyffyKnowledgeNudge
	@module @devpulse/design/blocks/clyffy

	The Clyffy knowledge-drop surface — auto-mount inline card OR
	hover-revealed tooltip — that delegates rendering to the
	right variant card from `@devpulse/design/blocks/knowledge`.

	# Migration path (Phase 4c)

	Prior revisions of this block reimplemented the entire
	card layout inline. The Phase 4 refactor extracted the
	rendering into `KnowledgeDykCard` / `KnowledgeKdropCard` /
	`KnowledgeFrustCard` / `KnowledgeInsightCard` /
	`KnowledgeGlossCard`; this block now picks the matching
	variant by `entry.entryType` after the fetch resolves.

	Callers consuming the legacy auto-mount surface continue to
	work. New surfaces should prefer:

	- `KnowledgeDeck` for context-driven auto-mount (chat empty,
	  wizard phase chip — picks the right variant per `entryType`
	  pulled from the engine's selector).
	- `KnowledgeTerm` for inline hover-glossary on technical
	  terms (lighter than this block; no helpful/not-helpful).

	This block remains the right call for the dedicated "I want
	exactly a Kdrop with auto-dismiss after 20s" pattern.

	# Trigger modes

	- `mode="auto"` — mounts the card inline + auto-fetches once
	  on mount. Optional auto-dismiss timer.
	- `mode="hover"` — wraps a trigger snippet; fetches + shows on
	  mouseover, dismisses on mouseleave or click-away.

	# ARIA

	- Auto mode: container is `role="status" aria-live="polite"`.
	- Hover mode: popover wrapped in `role="tooltip"`.
	- The variant cards own their own per-region `aria-labelledby`.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { onMount } from "svelte";
import {
	KnowledgeDykCard,
	KnowledgeFrustCard,
	KnowledgeGlossCard,
	KnowledgeInsightCard,
	KnowledgeKdropCard,
} from "$lib/design/blocks/knowledge/index.js";
import { knowledgeState } from "$lib/domains/app/knowledge/data-access/knowledge.state.svelte.js";
import {
	hasTitleBody,
	isGlossary,
	type KnowledgeEntryType,
} from "$lib/domains/app/knowledge/util/index.js";

interface Props {
	/**
	 * Trigger mode. `auto` mounts the card inline + auto-fetches.
	 * `hover` wraps a trigger and shows on mouseover only.
	 */
	mode: "auto" | "hover";
	/** Which knowledge catalog to pull from. */
	entryType: KnowledgeEntryType;
	/**
	 * Tool context — affinity-weights selection toward entries
	 * tagged for this tool ("models", "wizard", "rro", …).
	 */
	tool?: string;
	/**
	 * Auto-dismiss the card after N ms with no user interaction.
	 * Mode-only: `auto`. `hover` follows the trigger's mouseleave.
	 */
	dismissAfterMs?: number;
	/**
	 * Trigger element snippet — required when `mode="hover"`. The
	 * block wraps the snippet in a `<span>` with mouseenter /
	 * mouseleave / focus / blur handlers and announces the popover
	 * via `aria-describedby`.
	 */
	trigger?: Snippet;
}

let { mode, entryType, tool, dismissAfterMs = 20000, trigger }: Props = $props();

const entry = $derived(knowledgeState.current);
const isOwnEntry = $derived(entry !== null && entry.entryType === entryType);

let hoverOpen = $state(false);
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

async function fetchEntry(): Promise<void> {
	await knowledgeState.fetchNext(entryType, tool);
	if (mode === "auto" && dismissAfterMs > 0) {
		armAutoDismiss();
	}
}

function armAutoDismiss(): void {
	if (autoDismissTimer !== null) clearTimeout(autoDismissTimer);
	autoDismissTimer = setTimeout(() => {
		knowledgeState.dismiss();
		autoDismissTimer = null;
	}, dismissAfterMs);
}

function cancelAutoDismiss(): void {
	if (autoDismissTimer !== null) {
		clearTimeout(autoDismissTimer);
		autoDismissTimer = null;
	}
}

async function handleReact(reaction: "helpful" | "not_helpful"): Promise<void> {
	cancelAutoDismiss();
	await knowledgeState.react(reaction);
}

function handleDismiss(): void {
	cancelAutoDismiss();
	knowledgeState.dismiss();
}

async function handleTriggerEnter(): Promise<void> {
	if (mode !== "hover") return;
	if (!entry || !isOwnEntry) {
		await fetchEntry();
	}
	hoverOpen = true;
}

function handleTriggerLeave(): void {
	if (mode !== "hover") return;
	hoverOpen = false;
}

onMount(() => {
	if (mode === "auto") {
		void fetchEntry();
	}
	return () => {
		cancelAutoDismiss();
	};
});
</script>

{#if mode === "hover"}
	<span
		class="clyffy-nudge__trigger"
		onmouseenter={handleTriggerEnter}
		onmouseleave={handleTriggerLeave}
		onfocusin={handleTriggerEnter}
		onfocusout={handleTriggerLeave}
		role="presentation"
	>
		{#if trigger}
			{@render trigger()}
		{/if}
	</span>

	{#if hoverOpen && entry && isOwnEntry}
		<div class="clyffy-nudge__hover-card" role="tooltip">
			{#if entry.entryType === "dyk" && hasTitleBody(entry)}
				<KnowledgeDykCard {entry} onDismiss={handleDismiss} live="off" />
			{:else if entry.entryType === "kdrop" && hasTitleBody(entry)}
				<KnowledgeKdropCard {entry} onDismiss={handleDismiss} live="off" />
			{:else if entry.entryType === "frust" && hasTitleBody(entry)}
				<KnowledgeFrustCard {entry} onDismiss={handleDismiss} live="off" />
			{:else if entry.entryType === "insight" && hasTitleBody(entry)}
				<KnowledgeInsightCard {entry} onDismiss={handleDismiss} live="off" />
			{:else if entry.entryType === "gloss" && isGlossary(entry)}
				<KnowledgeGlossCard {entry} onDismiss={handleDismiss} live="off" />
			{/if}
		</div>
	{/if}
{:else if entry && isOwnEntry}
	{#if entry.entryType === "dyk" && hasTitleBody(entry)}
		<KnowledgeDykCard
			{entry}
			onHelpful={() => handleReact("helpful")}
			onNotHelpful={() => handleReact("not_helpful")}
			onDismiss={handleDismiss}
		/>
	{:else if entry.entryType === "kdrop" && hasTitleBody(entry)}
		<KnowledgeKdropCard
			{entry}
			onHelpful={() => handleReact("helpful")}
			onNotHelpful={() => handleReact("not_helpful")}
			onDismiss={handleDismiss}
		/>
	{:else if entry.entryType === "frust" && hasTitleBody(entry)}
		<KnowledgeFrustCard
			{entry}
			onHelpful={() => handleReact("helpful")}
			onNotHelpful={() => handleReact("not_helpful")}
			onDismiss={handleDismiss}
		/>
	{:else if entry.entryType === "insight" && hasTitleBody(entry)}
		<KnowledgeInsightCard
			{entry}
			onHelpful={() => handleReact("helpful")}
			onNotHelpful={() => handleReact("not_helpful")}
			onDismiss={handleDismiss}
		/>
	{:else if entry.entryType === "gloss" && isGlossary(entry)}
		<KnowledgeGlossCard {entry} showMascot onDismiss={handleDismiss} />
	{/if}
{/if}

<style>
	.clyffy-nudge__trigger {
		display: inline-flex;
		align-items: baseline;
	}

	.clyffy-nudge__hover-card {
		position: absolute;
		z-index: 70;
		margin-top: var(--space-5, 0.5rem);
		max-width: 22rem;
		pointer-events: none;
	}
</style>

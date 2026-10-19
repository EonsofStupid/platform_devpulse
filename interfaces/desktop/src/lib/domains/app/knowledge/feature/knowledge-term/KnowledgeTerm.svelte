<!--
	@block KnowledgeTerm
	@module @devpulse/design/blocks/knowledge

	Inline term wrapper that surfaces the matching glossary entry
	on hover OR keyboard focus. Wraps any inline text content —
	the wrapped element stays visually identical until interaction
	(except for a subtle underline to signal interactivity).

	# Usage

	```svelte
	<KnowledgeTerm term="VRAM">VRAM</KnowledgeTerm>
	<p>
		Your <KnowledgeTerm term="VRAM">VRAM</KnowledgeTerm> tier
		dictates which <KnowledgeTerm term="preset">preset</KnowledgeTerm>
		the wizard picks.
	</p>
	```

	The block looks up the glossary entry by `term` (case-insensitive
	match against `payload.term` field on entries with
	`entryType === "gloss"`). On first hover/focus it fetches via
	the kernel selector with a hint that the desired term matches.

	# WAI-ARIA APG: Tooltip pattern

	- The trigger is `<span>` (inline). Wraps wrapped content
	  unchanged.
	- Hover OR keyboard focus (`tabindex="0"`) opens the popover.
	- `aria-describedby` points at the popover when open so AT
	  users get the definition as supplementary text.
	- Esc closes; mouseleave / blur closes.

	Source: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

	# Visual treatment

	A dotted-underline signals interactivity without competing
	with regular link styling. The popover uses the purple
	`KnowledgeGlossCard` accent so users associate "purple = a
	definition" across the whole product.

	# Why this exists separately from `ClyffyKnowledgeNudge`

	`ClyffyKnowledgeNudge mode="hover"` is for broader entry
	types (kdrop, frust, insight) and supports the heavier
	helpful/not-helpful interaction. `KnowledgeTerm` is the
	lightweight, inline glossary-only path that's safe to
	sprinkle through long-form copy without performance worry.
-->
<script lang="ts">
import { onDestroy, type Snippet } from "svelte";
import { Card } from "$lib/design/components/card/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { knowledgeState } from "../../data-access/knowledge.state.svelte.js";
import { isGlossary } from "../../util/index.js";

interface Props {
	/**
	 * The term to look up in the glossary. Case-insensitive match
	 * against `payload.term` on `gloss`-type entries. Must match
	 * a seeded glossary entry exactly (modulo case) for the
	 * tooltip to populate.
	 */
	term: string;
	/** Optional tool tag for affinity-weighted selection. */
	tool?: string;
	/** Wrapped content — defaults to rendering the `term` string. */
	children?: Snippet;
	/** Disable the underline visual cue. */
	plain?: boolean;
}

let { term, tool, children, plain = false }: Props = $props();

let open = $state(false);
let hoverTimer: ReturnType<typeof setTimeout> | null = null;

const entry = $derived(knowledgeState.current);
const matchesTerm = $derived(
	entry !== null && isGlossary(entry) && entry.payload.term.toLowerCase() === term.toLowerCase(),
);

async function ensureFetched(): Promise<void> {
	if (matchesTerm) return;
	await knowledgeState.fetchNext("gloss", tool);
}

function handleEnter(): void {
	if (hoverTimer !== null) clearTimeout(hoverTimer);
	hoverTimer = setTimeout(() => {
		void ensureFetched().then(() => {
			open = true;
		});
	}, 250);
}

function handleLeave(): void {
	if (hoverTimer !== null) clearTimeout(hoverTimer);
	hoverTimer = null;
	open = false;
}

function handleKey(e: KeyboardEvent): void {
	if (e.key === "Escape") {
		open = false;
	}
}

onDestroy(() => {
	if (hoverTimer !== null) clearTimeout(hoverTimer);
});

const popoverId = $derived(`kt-${term.replace(/\s+/g, "-").toLowerCase()}`);
</script>

<span
	class="knowledge-term"
	class:knowledge-term--plain={plain}
	tabindex="0"
	role="button"
	aria-describedby={open ? popoverId : undefined}
	aria-expanded={open}
	onmouseenter={handleEnter}
	onmouseleave={handleLeave}
	onfocusin={handleEnter}
	onfocusout={handleLeave}
	onkeydown={handleKey}
>
	{#if children}{@render children()}{:else}{term}{/if}

	{#if open && entry && isGlossary(entry) && matchesTerm}
		<span
			id={popoverId}
			class="knowledge-term__popover"
			role="tooltip"
		>
			<Card preset="glass" class="knowledge-term__card">
				<Text size="xs" weight="semibold" color="muted" as="p">Glossary</Text>
				<Text size="sm" weight="semibold" as="p">{entry.payload.term}</Text>
				<Text size="sm" as="p">{entry.payload.definition}</Text>
			</Card>
		</span>
	{/if}
</span>

<style>
	.knowledge-term {
		position: relative;
		display: inline;
		cursor: help;
		text-decoration: underline dotted
			color-mix(in oklch, var(--accent-purple-main) 60%, transparent);
		text-decoration-thickness: 0.0625rem;
		text-underline-offset: 0.1875rem;
		outline-offset: 0.125rem;
	}

	.knowledge-term--plain {
		text-decoration: none;
		cursor: default;
	}

	.knowledge-term:focus-visible {
		outline: 0.125rem solid var(--accent-purple-main);
		border-radius: 0.125rem;
	}

	.knowledge-term__popover {
		position: absolute;
		bottom: calc(100% + 0.375rem);
		left: 0;
		z-index: 9200;
		min-width: clamp(14rem, 28vw, 22rem);
		max-width: clamp(18rem, 32vw, 26rem);
		pointer-events: none;
	}

	:global(.knowledge-term__card) {
		display: flex;
		flex-direction: column;
		gap: clamp(0.25rem, 0.4vw + 0.125rem, 0.5rem);
		padding: clamp(0.625rem, 0.7vw + 0.25rem, 0.875rem)
			clamp(0.75rem, 0.8vw + 0.25rem, 1rem);
		border-left: 0.1875rem solid var(--accent-purple-main);
	}
</style>

<!--
	@block KnowledgeMultipleChoiceCard
	@module @devpulse/design/blocks/knowledge

	Interactive multiple-choice variant. Renders a prompt and a
	set of choices; user picks one; an optional explanation
	appears in place of the picker after a selection. Useful for
	"check your understanding" surfaces during long-running
	actions, onboarding, or to test the user's preference
	(e.g. "which tier matches your workflow?").

	# Direct-props block

	Until the kernel `EntryType` enum grows a `Quiz` variant +
	seeded JSON, this card takes its data as direct typed props
	(no `KnowledgeEntry` argument). When the kernel extension
	lands, a thin adapter will translate `entry.payload` into
	these props — the rendering surface stays identical.

	# WAI-ARIA APG: Radio Group pattern

	The choice set is rendered as a `role="radiogroup"` with one
	`role="radio"` per choice. Arrow keys move focus between
	radios; Space / Enter selects. After a selection,
	`aria-checked="true"` lands on the chosen radio; the
	explanation announces as a `role="status"` region.

	Source: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
-->
<script lang="ts">
import { Button } from "#coldlight/components/button/index.js";
import { Text } from "#coldlight/components/text/index.js";
import ClyffyHeadshot from "../clyffy/ClyffyHeadshot.svelte";
import KnowledgeCard from "./KnowledgeCard.svelte";

export interface KnowledgeChoice {
	/** Stable choice id — used as the value passed to `onChoose`. */
	id: string;
	/** Visible label. */
	label: string;
	/**
	 * Optional explanation shown after this choice is selected.
	 * When omitted, the card just records the choice and
	 * dismisses on the caller's signal.
	 */
	explanation?: string;
	/**
	 * Whether this is the "correct" choice. Drives optional
	 * positive/warning accent on the explanation. Leave unset
	 * for opinion-based prompts where there's no right answer.
	 */
	isCorrect?: boolean;
}

interface Props {
	/** Stable id for the heading region — `aria-labelledby` target. */
	id: string;
	/** The prompt the user is answering. */
	prompt: string;
	/** Choice set. Order is preserved. */
	choices: KnowledgeChoice[];
	/** Kicker shown above the prompt. Defaults to "Quick check". */
	kicker?: string;
	/** Caller hook when the user picks a choice. */
	onChoose?: (choiceId: string) => void;
	/** Caller hook to dismiss the card entirely. */
	onDismiss?: () => void;
	/** Layman labels. */
	labels?: {
		dismissAria: string;
		continueLabel: string;
	};
	/**
	 * `aria-live`. Defaults to `polite` since the card typically
	 * appears in response to a context change.
	 */
	live?: "off" | "polite" | "assertive";
}

let {
	id,
	prompt,
	choices,
	kicker = "Quick check",
	onChoose,
	onDismiss,
	labels,
	live = "polite",
}: Props = $props();

const resolved = $derived({
	dismissAria: labels?.dismissAria ?? "Dismiss",
	continueLabel: labels?.continueLabel ?? "Got it",
});

const headingId = $derived(`kc-mcq-${id}`);
const groupLabelId = $derived(`kc-mcq-${id}-prompt`);

let selectedId = $state<string | null>(null);
const selected = $derived(
	selectedId === null ? null : (choices.find((c) => c.id === selectedId) ?? null),
);
const explanationAccent = $derived.by<"cyan" | "positive" | "hotpink">(() => {
	if (!selected || selected.isCorrect === undefined) return "cyan";
	return selected.isCorrect ? "positive" : "hotpink";
});

function pick(id: string): void {
	selectedId = id;
	onChoose?.(id);
}

function keyHandler(e: KeyboardEvent, index: number): void {
	const directionKeys: Record<string, number> = {
		ArrowDown: 1,
		ArrowRight: 1,
		ArrowUp: -1,
		ArrowLeft: -1,
	};
	const direction = directionKeys[e.key];
	if (direction === undefined) return;
	e.preventDefault();
	const nextIndex = (index + direction + choices.length) % choices.length;
	pick(choices[nextIndex].id);
	const nextEl = document.getElementById(`kc-mcq-${id}-choice-${nextIndex}`);
	nextEl?.focus();
}
</script>

<KnowledgeCard accent={explanationAccent} {headingId} {live}>
	{#snippet mascot()}
		<ClyffyHeadshot pose="thinking" size="md" decorative />
	{/snippet}
	{#snippet heading()}
		<Text size="xs" weight="semibold" color="muted" as="p">{kicker}</Text>
		<Text id={groupLabelId} size="sm" weight="semibold" as="p">{prompt}</Text>
	{/snippet}
	{#snippet body()}
		{#if selected && selected.explanation}
			<Text size="sm" as="p">{selected.explanation}</Text>
		{:else}
			<div
				class="knowledge-mcq__choices"
				role="radiogroup"
				aria-labelledby={groupLabelId}
			>
				{#each choices as choice, index (choice.id)}
					{@const isChecked = selectedId === choice.id}
					<button
						type="button"
						id={`kc-mcq-${id}-choice-${index}`}
						class="knowledge-mcq__choice"
						class:is-checked={isChecked}
						role="radio"
						aria-checked={isChecked}
						tabindex={isChecked || (selectedId === null && index === 0) ? 0 : -1}
						onclick={() => pick(choice.id)}
						onkeydown={(e) => keyHandler(e, index)}
					>
						<span class="knowledge-mcq__radio" aria-hidden="true"></span>
						<span class="knowledge-mcq__label">{choice.label}</span>
					</button>
				{/each}
			</div>
		{/if}
	{/snippet}
	{#snippet actions()}
		<div style="flex: 1;"></div>
		{#if selected && onDismiss}
			<Button preset="primary" size="sm" onclick={onDismiss}>
				{resolved.continueLabel}
			</Button>
		{:else if onDismiss}
			<Button
				preset="ghost"
				size="sm"
				aria-label={resolved.dismissAria}
				onclick={onDismiss}
			>
				×
			</Button>
		{/if}
	{/snippet}
</KnowledgeCard>

<style>
	.knowledge-mcq__choices {
		display: flex;
		flex-direction: column;
		gap: clamp(0.25rem, 0.4vw + 0.125rem, 0.5rem);
	}

	.knowledge-mcq__choice {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 0.6vw + 0.25rem, 0.75rem);
		min-height: 2.25rem;
		padding: clamp(0.375rem, 0.5vw + 0.125rem, 0.625rem)
			clamp(0.625rem, 0.8vw + 0.25rem, 0.875rem);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: var(--radius-md, 0.375rem);
		background: var(--surface-raised);
		color: var(--text-default);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease;
	}

	.knowledge-mcq__choice:hover {
		border-color: color-mix(in oklch, var(--accent-cyan-main) 40%, var(--border-subtle));
	}

	.knowledge-mcq__choice:focus-visible {
		outline: 0.125rem solid var(--accent-cyan-main);
		outline-offset: 0.125rem;
	}

	.knowledge-mcq__choice.is-checked {
		border-color: color-mix(in oklch, var(--accent-cyan-main) 60%, var(--border-subtle));
		background: color-mix(in oklch, var(--accent-cyan-main) 8%, var(--surface-raised));
	}

	.knowledge-mcq__radio {
		flex-shrink: 0;
		width: 0.875rem;
		height: 0.875rem;
		border-radius: var(--radius-full);
		border: 0.125rem solid var(--text-muted);
		background: transparent;
	}

	.knowledge-mcq__choice.is-checked .knowledge-mcq__radio {
		border-color: var(--accent-cyan-main);
		background:
			radial-gradient(
				circle at center,
				var(--accent-cyan-main) 0,
				var(--accent-cyan-main) 35%,
				transparent 38%
			);
	}

	.knowledge-mcq__label {
		flex: 1;
		min-width: 0;
		line-height: 1.4;
	}
</style>

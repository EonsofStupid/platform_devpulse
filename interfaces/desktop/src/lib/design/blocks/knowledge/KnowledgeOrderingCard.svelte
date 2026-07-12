<!--
	@block KnowledgeOrderingCard
	@module @devpulse/design/blocks/knowledge

	Interactive ordering variant. Renders a prompt + a list of
	items; the user reorders them via Move-Up / Move-Down
	buttons. Serves both "rearrange by preference" and "order of
	implementation" surfaces — the kicker prop and `intent` flip
	the framing without forking the component.

	# Why button-driven reorder (not drag-and-drop)

	Drag-and-drop is hostile to keyboard and screen-reader
	users. The APG Listbox pattern with explicit move
	commands is the WAI-recommended accessible alternative:

	- Each item is `role="option"` inside `role="listbox"`.
	- Arrow keys move focus between items; Space activates
	  selection.
	- Per-item Move Up / Move Down buttons mutate the order
	  and announce the change via the live region.

	Source: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
	+ https://www.w3.org/WAI/ARIA/apg/patterns/grid/ (for
		multi-action keyboard cells; we keep it simpler).

	# Direct-props block (same rationale as MultipleChoice)

	Takes the prompt + items + handlers directly. A future
	engine `Order` EntryType will hand a translated payload.
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import ClyffyHeadshot from "../clyffy/ClyffyHeadshot.svelte";
import KnowledgeCard from "./KnowledgeCard.svelte";

export interface KnowledgeOrderingItem {
	/** Stable id — used as the value in `onReorder` callback. */
	id: string;
	/** Visible label. */
	label: string;
	/** Optional supplemental detail rendered under the label. */
	detail?: string;
}

/**
 * Framing of the ordering task.
 *
 * - `preference` — "Drag in order of preference" semantic
 *   (purple accent, "Rearrange" kicker).
 * - `sequence`   — "What's the right order of steps" semantic
 *   (teal accent, "Put in order" kicker).
 */
export type KnowledgeOrderingIntent = "preference" | "sequence";

interface Props {
	/** Unique id for the listbox region (used by aria-labelledby). */
	id: string;
	/** Prompt the user reads before reordering. */
	prompt: string;
	/** Initial item order — caller's source of truth. */
	items: KnowledgeOrderingItem[];
	/** Intent framing — drives accent + default kicker. Default `preference`. */
	intent?: KnowledgeOrderingIntent;
	/** Kicker. When omitted, derives from `intent`. */
	kicker?: string;
	/** Caller hook fired after every reorder. Receives ids in new order. */
	onReorder?: (orderedIds: string[]) => void;
	/** Caller hook to dismiss / accept the current order. */
	onAccept?: (orderedIds: string[]) => void;
	/** Caller hook to dismiss without saving. */
	onDismiss?: () => void;
	/** Layman labels. */
	labels?: {
		moveUpAria: string;
		moveDownAria: string;
		acceptLabel: string;
		dismissAria: string;
	};
	/** `aria-live` for the card region. */
	live?: "off" | "polite" | "assertive";
}

let {
	id,
	prompt,
	items: initialItems,
	intent = "preference",
	kicker,
	onReorder,
	onAccept,
	onDismiss,
	labels,
	live = "polite",
}: Props = $props();

const resolved = $derived({
	moveUpAria: labels?.moveUpAria ?? "Move up",
	moveDownAria: labels?.moveDownAria ?? "Move down",
	acceptLabel: labels?.acceptLabel ?? "Save order",
	dismissAria: labels?.dismissAria ?? "Cancel",
});

const resolvedKicker = $derived(kicker ?? (intent === "preference" ? "Rearrange" : "Put in order"));

const accent = $derived<"purple" | "teal">(intent === "preference" ? "purple" : "teal");
const headingId = $derived(`kc-order-${id}`);
const listboxLabelId = $derived(`kc-order-${id}-prompt`);
const statusId = $derived(`kc-order-${id}-status`);

// svelte-ignore state_referenced_locally -- intentional one-time seed:
// the ordering exercise starts from the prop and then owns its state.
let order = $state<KnowledgeOrderingItem[]>([...initialItems]);
let focusedIndex = $state(0);
let lastMoveMessage = $state("");

function move(index: number, direction: -1 | 1): void {
	const target = index + direction;
	if (target < 0 || target >= order.length) return;
	const next = [...order];
	const [removed] = next.splice(index, 1);
	next.splice(target, 0, removed);
	order = next;
	focusedIndex = target;
	lastMoveMessage = `${removed.label} moved ${direction === -1 ? "up" : "down"} to position ${target + 1}`;
	onReorder?.(order.map((i) => i.id));
	// Re-focus the moved item so keyboard users can keep operating.
	requestAnimationFrame(() => {
		const el = document.getElementById(`kc-order-${id}-item-${target}`);
		el?.focus();
	});
}

function keyHandler(e: KeyboardEvent, index: number): void {
	switch (e.key) {
		case "ArrowDown":
			e.preventDefault();
			focusedIndex = Math.min(order.length - 1, index + 1);
			document.getElementById(`kc-order-${id}-item-${focusedIndex}`)?.focus();
			break;
		case "ArrowUp":
			e.preventDefault();
			focusedIndex = Math.max(0, index - 1);
			document.getElementById(`kc-order-${id}-item-${focusedIndex}`)?.focus();
			break;
		case "Home":
			e.preventDefault();
			focusedIndex = 0;
			document.getElementById(`kc-order-${id}-item-0`)?.focus();
			break;
		case "End":
			e.preventDefault();
			focusedIndex = order.length - 1;
			document.getElementById(`kc-order-${id}-item-${focusedIndex}`)?.focus();
			break;
	}
}
</script>

<KnowledgeCard {accent} {headingId} {live}>
	{#snippet mascot()}
		<ClyffyHeadshot pose="thinking" size="md" decorative />
	{/snippet}
	{#snippet heading()}
		<Text size="xs" weight="semibold" color="muted" as="p">{resolvedKicker}</Text>
		<Text id={listboxLabelId} size="sm" weight="semibold" as="p">{prompt}</Text>
	{/snippet}
	{#snippet body()}
		<ol
			class="knowledge-order__list"
			role="listbox"
			tabindex={0}
			aria-labelledby={listboxLabelId}
			aria-activedescendant={`kc-order-${id}-item-${focusedIndex}`}
		>
			{#each order as item, index (item.id)}
				<li
					id={`kc-order-${id}-item-${index}`}
					class="knowledge-order__item"
					role="option"
					tabindex={index === focusedIndex ? 0 : -1}
					aria-selected={index === focusedIndex}
					onkeydown={(e) => keyHandler(e, index)}
				>
					<span class="knowledge-order__rank" aria-hidden="true">{index + 1}</span>
					<span class="knowledge-order__content">
						<Text size="sm" weight="semibold" as="span">{item.label}</Text>
						{#if item.detail}
							<Text size="xs" color="muted" as="span">{item.detail}</Text>
						{/if}
					</span>
					<span class="knowledge-order__controls">
						<Button
							preset="ghost"
							size="sm"
							aria-label={`${resolved.moveUpAria}: ${item.label}`}
							disabled={index === 0}
							onclick={() => move(index, -1)}
						>
							↑
						</Button>
						<Button
							preset="ghost"
							size="sm"
							aria-label={`${resolved.moveDownAria}: ${item.label}`}
							disabled={index === order.length - 1}
							onclick={() => move(index, 1)}
						>
							↓
						</Button>
					</span>
				</li>
			{/each}
		</ol>
		<div id={statusId} class="knowledge-order__sr" role="status" aria-live="polite">
			{lastMoveMessage}
		</div>
	{/snippet}
	{#snippet actions()}
		<div style="flex: 1;"></div>
		{#if onDismiss}
			<Button
				preset="ghost"
				size="sm"
				aria-label={resolved.dismissAria}
				onclick={onDismiss}
			>
				×
			</Button>
		{/if}
		{#if onAccept}
			<Button preset="primary" size="sm" onclick={() => onAccept(order.map((i) => i.id))}>
				{resolved.acceptLabel}
			</Button>
		{/if}
	{/snippet}
</KnowledgeCard>

<style>
	.knowledge-order__list {
		display: flex;
		flex-direction: column;
		gap: clamp(0.25rem, 0.4vw + 0.125rem, 0.5rem);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.knowledge-order__item {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 0.6vw + 0.25rem, 0.75rem);
		min-height: 2.25rem;
		padding: clamp(0.375rem, 0.5vw + 0.125rem, 0.625rem)
			clamp(0.5rem, 0.6vw + 0.25rem, 0.75rem);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: var(--radius-md, 0.375rem);
		background: var(--surface-raised);
		min-width: 0;
	}

	.knowledge-order__item:focus-visible {
		outline: 0.125rem solid var(--accent-purple-main);
		outline-offset: 0.125rem;
	}

	.knowledge-order__item[aria-selected="true"] {
		border-color: color-mix(in oklch, var(--accent-purple-main) 50%, var(--border-subtle));
		background: color-mix(in oklch, var(--accent-purple-main) 6%, var(--surface-raised));
	}

	.knowledge-order__rank {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--radius-full);
		background: var(--surface-inset);
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.knowledge-order__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
	}

	.knowledge-order__controls {
		flex-shrink: 0;
		display: flex;
		gap: 0.125rem;
	}

	/* Visually hidden but available to AT. The reorder live
	   region announces each move so screen reader users hear
	   "<item> moved up to position 3" without needing to
	   re-read the list. */
	.knowledge-order__sr {
		position: absolute;
		width: 0.0625rem;
		height: 0.0625rem;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>

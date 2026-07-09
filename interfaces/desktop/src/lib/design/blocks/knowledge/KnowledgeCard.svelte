<!--
	@block KnowledgeCard
	@module @devpulse/design/blocks/knowledge

	The BASE PATTERN every knowledge surface composes off of.
	A presentational primitive — zero state, zero fetching, zero
	business logic. Takes a typed entry + four slots (mascot,
	heading, body, actions) and renders a ColdLight-token surface
	with WAI-ARIA APG `region` semantics, fluid clamp spacing, and
	the accent color the caller asks for.

	# Why this exists separately from ClyffyKnowledgeNudge

	`ClyffyKnowledgeNudge` couples two concerns into one block:
	(1) the AUTO / HOVER orchestration that fetches an entry and
	auto-dismisses it, and (2) the card rendering that turns an
	entry into pixels. Pulling the rendering into its own
	primitive lets every variant — quiz card, rearrange card,
	ordering card, plus the existing dyk/kdrop/gloss surfaces —
	share the same visual contract without reimplementing it. The
	nudge becomes a thin orchestrator that picks a variant card
	and forwards the entry to it.

	# Slot contract

	Four named snippets, all optional:

	- `mascot`  — left-side Clyffy presence (typically
	  `<ClyffyHeadshot size="md" pose="thinking" />`). When
	  omitted, the card renders without a mascot column.
	- `heading` — top-of-body label area. Use `<Text size="xs"
	  color="muted">` for a kicker and `<Text size="sm"
	  weight="semibold">` for the title. The block sets the
	  `id` of this region and points `aria-labelledby` at it.
	- `body`    — the main entry content. Free-form Svelte; the
	  block enforces vertical rhythm and reading width.
	- `actions` — footer button row. Anything goes; the block
	  reserves a `.spacer` you can use to push items to opposite
	  ends.

	# ARIA contract (WAI-ARIA APG conformant)

	- Root has `role="region"` + `aria-labelledby` pointing at
	  the heading id. AT users hear the heading when they enter
	  the region and can navigate it as a landmark.
	- `aria-live` is OPT-IN via the `live` prop. Set
	  `live="polite"` only when the card appears asynchronously
	  AFTER initial render (auto-mode nudges); leave it unset
	  when the card is always present (chat-empty splash, wizard
	  phases) so AT doesn't double-announce.
	- The mascot column gets `aria-hidden="true"` because the
	  heading already names the content; the mascot is
	  decorative reinforcement.
	- Action buttons MUST carry their own `aria-label` since
	  visible labels may be icon-only or one-word.

	# ColdLight token contract

	Every visible style binds to a token — no hardcoded oklch /
	hex. The `accent` prop selects which accent token family
	feeds the strip glow + heading kicker:

	- `cyan`     — default for DYK / facts (curious-blue tone)
	- `teal`     — for kdrop / deeper-tip surfaces
	- `blue`     — for insight / pattern surfaces
	- `purple`   — for glossary / definition surfaces
	- `hotpink`  — for frustration-relief surfaces (high attention)
	- `positive` — for success-y / completion surfaces

	# Fluid clamp

	Spacing scales with viewport via `clamp(min, vw, max)` per
	the ColdLight fluid-clamp pipeline (`project_fluid_clamp`).
	The block ships a minimum (mobile-friendly) and a maximum
	(prevents desktop bloat) plus a vw-based middle term.

	# Used by

	- `KnowledgeDykCard`, `KnowledgeKdropCard`, `KnowledgeGlossCard`
	- `KnowledgeMultipleChoiceCard`, `KnowledgeRearrangeCard`,
	  `KnowledgeOrderingCard`
	- `ClyffyKnowledgeNudge` (after refactor — picks a variant and
	  forwards the entry).
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Card } from "$lib/design/components/card/index.js";

/** Accent token family driving strip + heading kicker color. */
export type KnowledgeCardAccent = "cyan" | "teal" | "blue" | "purple" | "hotpink" | "positive";

interface Props {
	/**
	 * Accent token family. Drives strip color + heading kicker.
	 * Defaults to `cyan` (the DYK / fact tone).
	 */
	accent?: KnowledgeCardAccent;
	/**
	 * Heading region id — used by `aria-labelledby`. Must be
	 * unique per page. The caller is responsible for uniqueness
	 * (typically composed from `entry.id`).
	 */
	headingId: string;
	/**
	 * `aria-live` mode. Set to `polite` when the card appears
	 * after initial render (auto-mode nudges, async-loaded
	 * content) so AT announces it. Leave unset for always-present
	 * surfaces (wizard phases, chat empty splash) to avoid
	 * double-announcement.
	 */
	live?: "off" | "polite" | "assertive";
	/**
	 * Card visual preset. Defaults to `glass` (semi-transparent
	 * surface that floats over the page). Pass `default` for an
	 * opaque card that sits as a primary surface.
	 */
	preset?: "glass" | "default" | "elevated" | "outlined";
	/** Mascot slot — typically `<ClyffyHeadshot ... />`. */
	mascot?: Snippet;
	/** Heading slot — kicker + title. */
	heading?: Snippet;
	/** Body slot — main entry content. */
	body?: Snippet;
	/** Footer actions slot. */
	actions?: Snippet;
}

let {
	accent = "cyan",
	headingId,
	live,
	preset = "glass",
	mascot,
	heading,
	body,
	actions,
}: Props = $props();
</script>

<section
	class="knowledge-card"
	data-accent={accent}
	aria-labelledby={headingId}
	aria-live={live}
>
	<Card {preset} class="knowledge-card__surface">
		<div class="knowledge-card__strip" aria-hidden="true"></div>
		<div class="knowledge-card__body">
			{#if mascot}
				<div class="knowledge-card__mascot" aria-hidden="true">
					{@render mascot()}
				</div>
			{/if}
			<div class="knowledge-card__content">
				{#if heading}
					<header id={headingId} class="knowledge-card__heading">
						{@render heading()}
					</header>
				{/if}
				{#if body}
					<div class="knowledge-card__main">
						{@render body()}
					</div>
				{/if}
				{#if actions}
					<footer class="knowledge-card__actions">
						{@render actions()}
					</footer>
				{/if}
			</div>
		</div>
	</Card>
</section>

<style>
	.knowledge-card {
		display: block;
		min-width: 0;
		max-width: clamp(20rem, 40vw, 36rem);
	}

	:global(.knowledge-card__surface) {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 0.6vw + 0.25rem, 0.875rem);
		padding: clamp(0.875rem, 0.8vw + 0.5rem, 1.25rem)
			clamp(1rem, 1vw + 0.5rem, 1.5rem);
		overflow: hidden;
	}

	/* Accent strip — vertical bar on the left, color-mixed from the
	   accent token family. Pure decoration; aria-hidden. */
	.knowledge-card__strip {
		position: absolute;
		inset: 0 auto 0 0;
		width: clamp(0.1875rem, 0.3vw + 0.125rem, 0.3125rem);
		background: var(--accent-strip);
	}

	.knowledge-card__body {
		display: flex;
		flex-direction: row;
		gap: clamp(0.75rem, 1vw + 0.25rem, 1.25rem);
		min-width: 0;
		padding-left: clamp(0.5rem, 0.6vw + 0.25rem, 0.875rem);
	}

	.knowledge-card__mascot {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
	}

	.knowledge-card__content {
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 0.6vw + 0.25rem, 0.875rem);
		min-width: 0;
		flex: 1;
	}

	.knowledge-card__heading {
		display: flex;
		flex-direction: column;
		gap: clamp(0.125rem, 0.2vw + 0.0625rem, 0.25rem);
	}

	.knowledge-card__main {
		display: flex;
		flex-direction: column;
		gap: clamp(0.375rem, 0.4vw + 0.25rem, 0.625rem);
		min-width: 0;
	}

	.knowledge-card__actions {
		display: flex;
		align-items: center;
		gap: clamp(0.375rem, 0.5vw + 0.125rem, 0.75rem);
		min-width: 0;
		flex-wrap: wrap;
	}

	/* Accent token resolution. Single CSS custom prop driven by
	   data-accent so the rest of the styles never branch. Each
	   accent maps to the locked ColdLight accent-{family}-main /
	   -glow tokens authored by the SD5 pipeline. */
	.knowledge-card[data-accent="cyan"] {
		--accent-strip: var(--accent-cyan-main);
	}
	.knowledge-card[data-accent="teal"] {
		--accent-strip: var(--accent-teal-main);
	}
	.knowledge-card[data-accent="blue"] {
		--accent-strip: var(--accent-blue-main);
	}
	.knowledge-card[data-accent="purple"] {
		--accent-strip: var(--accent-purple-main);
	}
	.knowledge-card[data-accent="hotpink"] {
		--accent-strip: var(--accent-hotpink-main);
	}
	.knowledge-card[data-accent="positive"] {
		--accent-strip: var(--accent-positive-main, var(--accent-teal-main));
	}
</style>

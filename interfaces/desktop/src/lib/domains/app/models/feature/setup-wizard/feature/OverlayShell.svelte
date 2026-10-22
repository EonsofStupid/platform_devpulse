<!--
	@file OverlayShell.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/overlay-shell

	Shared overlay shell composed from ColdLight primitives. Visual
	styling comes from preset chains via renderForge — this file
	NEVER authors color / border / shadow CSS directly.

	## 4 surface tiers — depth-stacked via ColdLight presets

	| Tier         | Where                          | Composition                  |
	|--------------|--------------------------------|------------------------------|
	| 1 (deepest)  | wizard backdrop                | root `[data-layout="setup"]` element (layout only — backdrop glow lives in app.css) |
	| 2            | card outer shell               | `<Card preset="glass">`      |
	| 3            | card inner content panel       | `<Card preset="stark">`      |
	| 4 (top)      | nested wells (consumer-owned)  | `<Card preset="matte">` in views |

	Layout-only CSS in this file: positioning, sizing, gap. No colors,
	no borders, no shadows — those flow from the Card preset chain.

	## Optional snippet slots

	- `mascot`  — Clyffy mascot in the header (pose changes per view).
	- `backdrop` — MP4 / animated video. Rendered behind the card.
	- `children` — view body content. Required.
	- `footer`  — Back / Skip / primary CTA buttons. Required.
-->
<script lang="ts">
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import type { Snippet } from "svelte";

interface Props {
	/** `aria-label` describing this overlay. */
	label: string;
	/** Step number (1-indexed) for the header indicator. */
	step: number;
	/** Total steps for the header indicator. */
	totalSteps: number;
	/** Heading text for the card header. */
	title: string;
	/** Optional Clyffy mascot snippet — rendered in the header. */
	mascot?: Snippet;
	/** Optional MP4 / animated backdrop video. */
	backdrop?: Snippet;
	/** View body content. */
	children: Snippet;
	/** Footer actions (Back / Skip / primary CTA). */
	footer: Snippet;
	/**
	 * Card width. `form` (default) is a single-column step (40rem);
	 * `wide` is for steps that lay content out in rows (e.g. the cortex
	 * constellation) and needs room for its container query to switch
	 * to the multi-column layout.
	 */
	width?: "form" | "wide";
}

let {
	label,
	step,
	totalSteps,
	title,
	mascot,
	backdrop,
	children,
	footer,
	width = "form",
}: Props = $props();

/** Layout only — Tailwind owns sizing; the glass preset owns the visuals. */
const cardClass = $derived(
	`shell-card relative m-auto flex w-full flex-col gap-4 p-6 ${
		width === "wide" ? "max-w-6xl" : "min-w-[30rem] max-w-[40rem]"
	}`,
);
</script>

<!--
	Tier 1: backdrop layer. `data-layout="setup"` picks up the radial
	glow + grid pattern declared in app.css for full-viewport setup
	shells. Position + size only — visuals come from the layout
	attribute.
-->
<div
	class="fixed inset-0 z-9000 flex overflow-y-auto p-6"
	data-layout="setup"
	role="dialog"
	aria-modal="true"
	aria-label={label}
>
	{#if backdrop}
		<div
			class="shell-backdrop-video pointer-events-none fixed inset-0 overflow-hidden [&_video]:size-full [&_video]:object-cover"
			aria-hidden="true"
		>
			{@render backdrop()}
		</div>
	{/if}

	<!-- Tier 2: card outer shell — ColdLight glass preset. `m-auto` inside
	     the scrolling flex root centers the card when it fits and lets it
	     scroll (instead of clipping top + bottom) when it is taller. -->
	<Card preset="glass" class={cardClass}>
		<header class="shell-head">
			<div class="shell-head-left">
				{#if mascot}
					<div class="shell-mascot">{@render mascot()}</div>
				{/if}
				<Heading level={2} size="lg">{title}</Heading>
			</div>
			<Text size="xs" class="text-frost-500">
				Step {step} of {totalSteps}
			</Text>
		</header>

		<!-- Tier 3: inner content panel — ColdLight stark preset. -->
		<Card preset="stark" class="shell-body">
			{@render children()}
		</Card>

		<footer class="shell-foot">
			{@render footer()}
		</footer>
	</Card>
</div>

<style>
	/* Layout-only. Visual styling (border / shadow / background) lives
	   in the Card preset chain (glass for outer, stark for body) and
	   the `[data-layout="setup"]` backdrop in app.css. */
	/* MP4 / animated backdrop slot — sits below the card, above the
	   layout backdrop. Positioning is Tailwind; only the dimming here. */
	.shell-backdrop-video {
		opacity: 0.35;
	}

	.shell-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.shell-head-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.shell-mascot {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
	}

	/* `:global()` — class is passed to a child `<Card>` component. */
	:global(.shell-body) {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-height: 9rem;
		padding: 1rem;
	}

	.shell-foot {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
</style>

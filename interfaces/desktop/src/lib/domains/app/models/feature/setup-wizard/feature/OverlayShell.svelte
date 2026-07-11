<!--
	@file OverlayShell.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/overlay-shell

	Shared overlay shell composed from ColdLight primitives. Visual
	styling comes from preset chains via renderForge — this file
	NEVER authors color / border / shadow CSS directly.

	## 4 surface tiers — depth-stacked via the `wizard-*` preset family

	Brand-hued tiers (tokens/src/presets/wizard.tokens.json — composed
	from the designed token library: glass surfaces, gradient fields,
	depth + glow stacks): blue glass shell → violet content panel → cyan
	wells. Color IS the requirement — the achromatic glass/stark tiers
	read as black boxes and are retired here.

	| Tier         | Where                          | Composition                  |
	|--------------|--------------------------------|------------------------------|
	| 1 (deepest)  | wizard backdrop                | `.shell-root` (layout only — backdrop glow lives in app.css `[data-layout="setup"]`) |
	| 2            | card outer shell               | `<Card preset="wizard-deep">` — blue glass + glow halo |
	| 3            | card inner content panel       | `<Card preset="wizard-solid">` — violet tint + purple glow |
	| 4 (top)      | nested wells (consumer-owned)  | `<Card preset="wizard-elevated">` in views — cyan raised glass |

	Layout-only CSS in this file: positioning, sizing, gap. No colors,
	no borders, no shadows — those flow from the Card preset chain.

	## Optional snippet slots

	- `mascot`  — Clyffy mascot in the header (pose changes per view).
	- `backdrop` — MP4 / animated video. Rendered behind the card.
	- `children` — view body content. Required.
	- `footer`  — Back / Skip / primary CTA buttons. Required.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";

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
}

let { label, step, totalSteps, title, mascot, backdrop, children, footer }: Props = $props();
</script>

<!--
	Tier 1: backdrop layer. `data-layout="setup"` picks up the radial
	glow + grid pattern declared in app.css for full-viewport setup
	shells. Position + size only — visuals come from the layout
	attribute.
-->
<div
	class="shell-root"
	data-layout="setup"
	role="dialog"
	aria-modal="true"
	aria-label={label}
>
	{#if backdrop}
		<div class="shell-backdrop-video" aria-hidden="true">
			{@render backdrop()}
		</div>
	{/if}

	<!-- Tier 2: card outer shell — wizard blue glass (glow halo + blur). -->
	<Card preset="wizard-deep" class="shell-card">
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

		<!-- Tier 3: inner content panel — wizard violet tint. -->
		<Card preset="wizard-solid" class="shell-body">
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
	.shell-root {
		position: fixed;
		inset: 0;
		z-index: 9000;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Container context — the wizard overlay is a `fixed` sibling of
		   the shell grid zones, so this is its only container seam for
		   container-fluid (cqi) tokens. See S1.C in S1-FLUID-TOKENS.md. */
		container-type: inline-size;
		container-name: setup-overlay;
	}

	/* MP4 / animated backdrop slot — sits below the card, above the
	   layout backdrop. Layout-only positioning. */
	.shell-backdrop-video {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		opacity: 0.35;
	}
	.shell-backdrop-video :global(video) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* The Card primitive provides the visual chrome. Only set sizing /
	   spacing concerns here that Card's preset doesn't own. `:global()`
	   because the class is passed to a child component (`<Card>`); the
	   class lands on Card's rendered root but Svelte's per-file scoper
	   can't track classes across component boundaries. */
	:global(.shell-card) {
		position: relative;
		display: flex;
		flex-direction: column;
		/* Container-fluid (cqi resolves against .shell-root, declared a
		   container in this file — S1.C): the card's rhythm scales with
		   the overlay, not the OS window. */
		gap: clamp(0.75rem, 1.5cqi, 1rem);
		padding: clamp(1rem, 2.5cqi, 1.5rem);
		/* min/max widths so child grids (AnatomyConstellation uses
		   max-width: 64rem) get their intended room; min() keeps the
		   card inside narrow windows instead of overflowing them.
		   40rem was crushing the cortex constellation's 3-column row
		   to ~183px per cell, which forced single-word title wrap. */
		min-width: min(30rem, 92cqi);
		max-width: 64rem;
		width: 100%;
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

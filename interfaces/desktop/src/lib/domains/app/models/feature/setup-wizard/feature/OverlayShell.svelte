<!--
	@file OverlayShell.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/overlay-shell

	SEPARATE CRISP CARDS — operator ruling 2026-07-14: there is NO
	enclosing shell box. The ENTIRE window is the animation (the
	dispatcher's fixed BackgroundScene layers); floating directly on it,
	as INDIVIDUAL crisp surfaces:

	  header card   (mascot · title · step)        — wizard-deep, slim
	  …children…    (the view's own separate cards) — each owns its chrome
	  footer card   (Back / Skip / primary CTA)     — wizard-deep, slim

	This file is a pure ARRANGER: it owns the column rhythm, fluid XY
	clamping (cqi for X, cqb for Y — root is container-type: size), and
	the two slim header/footer cards. Zero color/border/shadow CSS —
	chrome flows from the preset chains.

	## Snippet slots
	- `mascot`   — Clyffy mascot in the header card (pose per view).
	- `backdrop` — optional extra per-view animated layer.
	- `children` — the view's separate floating surfaces. Required.
	- `footer`   — Back / Skip / primary CTA. Required.
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
	/** Heading text for the header card. */
	title: string;
	/** Optional Clyffy mascot snippet — rendered in the header card. */
	mascot?: Snippet;
	/** Optional extra animated backdrop layer. */
	backdrop?: Snippet;
	/** View body content — separate floating surfaces. */
	children: Snippet;
	/** Footer actions (Back / Skip / primary CTA). */
	footer: Snippet;
}

let { label, step, totalSteps, title, mascot, backdrop, children, footer }: Props = $props();
</script>

<!--
	Root layer — TRANSPARENT: the dispatcher's fixed BackgroundScene
	layers (z 8999) own the full viewport; nothing here paints over
	them. The old `data-layout="setup"` circuit-board field died
	2026-07-14 — it had covered the MP4 since the beginning.
-->
<div
	class="shell-root"
	role="dialog"
	aria-modal="true"
	aria-label={label}
>
	{#if backdrop}
		<div class="shell-backdrop-video" aria-hidden="true">
			{@render backdrop()}
		</div>
	{/if}

	<div class="shell-stack">
		<!-- Header — its own slim crisp card floating on the animation. -->
		<Card preset="wizard-deep" class="shell-head-card">
			<div class="shell-head-left">
				{#if mascot}
					<div class="shell-mascot">{@render mascot()}</div>
				{/if}
				<Heading level={2} size="lg">{title}</Heading>
			</div>
			<Text size="xs" class="text-frost-500">
				Step {step} of {totalSteps}
			</Text>
		</Card>

		<!-- The view's surfaces — each a SEPARATE card owning its chrome;
		     no wrapper paints anything between them and the animation. -->
		{@render children()}

		<!-- Footer — its own slim crisp card. -->
		<Card preset="wizard-deep" class="shell-foot-card">
			{@render footer()}
		</Card>
	</div>
</div>

<style>
	/* PURE ARRANGER — layout + fluid XY only. Chrome lives in the
	   preset chains the cards wear. */
	.shell-root {
		position: fixed;
		inset: 0;
		z-index: 9000;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Container seam for container-fluid tokens (S1.C). `size`,
		   not inline-size: the root is inset-0 fixed with a definite
		   height, so BOTH axes are queryable — cqi for X, cqb for Y
		   (fluid XY clamping, operator ruling 2026-07-14). */
		container-type: size;
		container-name: setup-overlay;
	}

	/* Optional per-view animated layer — under the cards. */
	.shell-backdrop-video {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}
	.shell-backdrop-video :global(video) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* The floating column — fluid XY: width clamps on cqi, height and
	   rhythm clamp on cqb. Scrolls itself if a view outgrows the
	   window; the animation never scrolls. */
	.shell-stack {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.8cqb, 1.5rem);
		width: min(64rem, 92cqi);
		max-height: 94cqb;
		overflow-y: auto;
		padding: clamp(0.25rem, 0.8cqb, 0.75rem);
	}

	/* Header/footer — slim row cards. `:global()` because the classes
	   land on child <Card> roots across the component boundary. */
	:global(.shell-head-card) {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: clamp(0.5rem, 1cqi, 1rem);
		padding: clamp(0.625rem, 1.2cqb, 1rem) clamp(0.875rem, 1.8cqi, 1.5rem);
	}

	.shell-head-left {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
		min-width: 0;
	}

	.shell-mascot {
		display: flex;
		align-items: center;
		justify-content: center;
		width: clamp(2rem, 3.5cqb, 2.5rem);
		height: clamp(2rem, 3.5cqb, 2.5rem);
	}

	:global(.shell-foot-card) {
		flex-direction: row;
		align-items: center;
		gap: clamp(0.375rem, 0.8cqi, 0.625rem);
		padding: clamp(0.5rem, 1cqb, 0.875rem) clamp(0.875rem, 1.8cqi, 1.5rem);
	}
</style>

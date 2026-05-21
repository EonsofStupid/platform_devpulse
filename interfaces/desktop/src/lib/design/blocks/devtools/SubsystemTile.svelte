<!--
	@block SubsystemTile
	@module @devpulse/design/blocks/devtools

	The "live subsystem" dashboard tile — a hover-revealed overlay that
	surfaces a subsystem's current state plus one-click verbs (download,
	test, swap, open-devtool) without forcing the dev to navigate into
	the dedicated devtool page first.

	Drives the dashboard's "Live subsystems" strip — Cortex / Vision /
	Ears (STT) / Mouth (TTS) / Reasoning (RRD). The dashboard is the
	auto-tuned baseline-establishing surface (feedback_devtools_are_dev_diagnostics
	2026-05-14 standard): the dev sees what the auto-config picked +
	can re-fire it in one click.

	# Interaction model

	- The tile is always a single `<a>` link to the dedicated devtool
	  (navigation on click).
	- Hover (or keyboard focus) on the tile pops the overlay
	  containing the layman state summary + the verb buttons.
	- The overlay closes on mouseleave / blur / Escape / outside click.
	  Verb buttons live OUTSIDE the link's click target so clicking
	  them never navigates.

	# Wire-up

	```svelte
	<SubsystemTile
		route="/devtools/clyffy/eyes/vision"
		label="Vision"
		blurb="SigLIP image embeddings"
		icon={Eye}
		accent="purple"
		status={{ tone: "up", label: "Ready · 1152-dim L2", detail: "siglip2-onnx · 8.7 GB" }}
		verbs={[
			{ id: "test", label: "Test encode", onclick: () => visionState.test() },
			{ id: "swap", label: "Swap model", onclick: () => visionState.openSwap() },
		]}
	/>
	```

	# ARIA contract

	- `role="link"` from the wrapping `<a>` — keyboard-navigable.
	- Hover overlay uses `role="region"` with `aria-label` describing
	  the subsystem (e.g. "Vision · live status").
	- Verb buttons are real `<button>` elements with their own
	  `aria-label`s so screen readers announce them when focused.
	- `prefers-reduced-motion` honoured — no transitions on the
	  popover open/close when reduced motion is requested.
-->
<script lang="ts">
import type { Component, Snippet } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { StatusDot } from "$lib/design/components/status-dot/index.js";
import { Text } from "$lib/design/components/text/index.js";

/** Layman-readable status tone — colours the StatusDot. */
export type SubsystemTone = "up" | "starting" | "degraded" | "down" | "stopped" | "unknown";

/** One-click verb the dev can fire without leaving the dashboard. */
export interface SubsystemVerb {
	/** Stable id for keying. */
	id: string;
	/** Layman label (no jargon). */
	label: string;
	/** Accessible label — used as `aria-label` (defaults to `label`). */
	ariaLabel?: string;
	/** Click handler. May be async. */
	onclick: () => void | Promise<void>;
	/** Disables the verb while it's running. */
	busy?: boolean;
	/** Disables for non-busy reasons (e.g. dependency not ready). */
	disabled?: boolean;
	/** Tone — `primary` is the canonical blue CTA; `danger` is red. */
	tone?: "primary" | "ghost" | "danger";
}

/** Live state summary rendered in the hover overlay. */
export interface SubsystemState {
	/** Coarse colour-coded health bucket. Drives the StatusDot. */
	tone: SubsystemTone;
	/** Layman one-liner (e.g. "Ready · 1152-dim L2"). */
	label: string;
	/**
	 * Optional supplemental line (e.g. "siglip2-onnx · 8.7 GB on disk").
	 * Keep technical bits here so the headline stays layman.
	 */
	detail?: string;
}

interface Props {
	/** Devtool route the tile links to on click. */
	route: string;
	/** Layman tile name (e.g. "Vision", "Reasoning"). */
	label: string;
	/** One-line blurb under the title. */
	blurb: string;
	/** Lucide icon component. */
	// biome-ignore lint/suspicious/noExplicitAny: lucide icons share a generic props shape
	icon: Component<any>;
	/**
	 * Brand accent name. Maps to `--accent-{name}-main` for the icon +
	 * focus ring + StatusDot accent. Pick from the ColdLight brand
	 * scale (purple, cyan, teal, ember, etc.).
	 */
	accent?: string;
	/**
	 * Live status — drives the hover overlay's status line + StatusDot.
	 * Named `status` (not `state`) so it does not shadow the `$state`
	 * rune inside this component's `<script>`.
	 */
	status: SubsystemState;
	/**
	 * One-click verbs. Rendered in order inside the overlay. Empty
	 * array hides the verb row but the state summary still shows on
	 * hover.
	 */
	verbs?: SubsystemVerb[];
	/**
	 * Optional extra-rich body the caller can inject below the
	 * verb row — e.g. a sparkline, a recent-call list. Keep it
	 * compact; the overlay is meant for at-a-glance read.
	 */
	overlayExtra?: Snippet;
}

let {
	route,
	label,
	blurb,
	icon: Icon,
	accent = "primary",
	status,
	verbs = [],
	overlayExtra,
}: Props = $props();

let overlayOpen = $state(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const accentStyle = $derived(
	`--accent-tile-main: var(--accent-${accent}-main); --accent-tile-fill: var(--accent-${accent}-fill);`,
);

const toneToDotState = {
	up: "success",
	starting: "warning",
	degraded: "warning",
	down: "error",
	stopped: "neutral",
	unknown: "neutral",
} as const;

function openNow(): void {
	if (closeTimer !== null) {
		clearTimeout(closeTimer);
		closeTimer = null;
	}
	overlayOpen = true;
}

function scheduleClose(): void {
	if (closeTimer !== null) clearTimeout(closeTimer);
	closeTimer = setTimeout(() => {
		overlayOpen = false;
		closeTimer = null;
	}, 180);
}

function handleVerbKeydown(event: KeyboardEvent): void {
	if (event.key === "Escape") {
		overlayOpen = false;
	}
}
</script>

<!--
	Container is a hover-disclosure region (WAI-ARIA non-modal popover
	pattern). The listeners on this wrapper manage overlay visibility
	only — they don't take semantic action. The truly-interactive
	children handle their own keyboard activation: the inner <a> opens
	the dedicated devtool, the overlay <button>s fire their verbs.
	The static a11y analyzer can't distinguish "delegation" from
	"action," so the ignore is deliberate.
-->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="subsystem-tile"
	style={accentStyle}
	onmouseenter={openNow}
	onmouseleave={scheduleClose}
	onfocusin={openNow}
	onfocusout={scheduleClose}
	onkeydown={handleVerbKeydown}
	role="group"
	aria-label="{label} subsystem"
>
	<a class="subsystem-tile__link" href={route}>
		<Icon size={20} class="subsystem-tile__icon" />
		<span class="subsystem-tile__title">
			<Text size="sm" weight="semibold" as="span">{label}</Text>
		</span>
		<span class="subsystem-tile__blurb">
			<Text size="xs" color="muted" as="span">{blurb}</Text>
		</span>
		<span class="subsystem-tile__dot" aria-hidden="true">
			<StatusDot status={toneToDotState[status.tone]} />
		</span>
	</a>

	{#if overlayOpen}
		<div
			class="subsystem-tile__overlay"
			role="region"
			aria-label="{label} live status"
			onmouseenter={openNow}
			onmouseleave={scheduleClose}
		>
			<Card preset="glass" class="subsystem-tile__overlay-card">
				<header class="subsystem-tile__overlay-header">
					<StatusDot status={toneToDotState[status.tone]} />
					<Text size="sm" weight="semibold" as="span">{status.label}</Text>
				</header>
				{#if status.detail}
					<Text size="xs" color="muted" as="p">{status.detail}</Text>
				{/if}

				{#if verbs.length > 0}
					<div class="subsystem-tile__verbs">
						{#each verbs as verb (verb.id)}
							<Button
								preset={verb.tone ?? "primary"}
								size="sm"
								disabled={verb.disabled || verb.busy}
								aria-label={verb.ariaLabel ?? verb.label}
								onclick={(event: MouseEvent) => {
									event.preventDefault();
									event.stopPropagation();
									void verb.onclick();
								}}
							>
								{#if verb.busy}
									<Spinner size="xs" />
								{/if}
								{verb.label}
							</Button>
						{/each}
					</div>
				{/if}

				{#if overlayExtra}
					<div class="subsystem-tile__extra">
						{@render overlayExtra()}
					</div>
				{/if}
			</Card>
		</div>
	{/if}
</div>

<style>
	.subsystem-tile {
		position: relative;
		display: flex;
	}

	.subsystem-tile__link {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto auto;
		grid-template-areas:
			"icon title dot"
			"icon blurb blurb";
		align-items: center;
		gap: var(--space-3) var(--space-7);
		padding: var(--space-9) var(--space-10);
		width: 100%;
		min-height: 4.5rem;
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: var(--border-width-hairline) solid var(--border-soft);
		color: var(--text-primary);
		text-decoration: none;
		transition: border-color 140ms ease-out, background 140ms ease-out;
	}

	.subsystem-tile__link:hover,
	.subsystem-tile__link:focus-visible {
		border-color: var(--accent-tile-main);
		background: color-mix(in oklch, var(--accent-tile-main) 6%, var(--surface-raised));
	}

	.subsystem-tile__link:focus-visible {
		outline: var(--border-width-thin) solid var(--accent-tile-main);
		outline-offset: var(--outline-offset-md);
	}

	:global(.subsystem-tile__icon) {
		grid-area: icon;
		color: var(--accent-tile-main);
	}

	.subsystem-tile__title {
		grid-area: title;
	}

	.subsystem-tile__blurb {
		grid-area: blurb;
	}

	.subsystem-tile__dot {
		grid-area: dot;
		display: inline-flex;
	}

	.subsystem-tile__overlay {
		position: absolute;
		top: calc(100% + var(--space-5));
		left: 0;
		right: 0;
		z-index: 70;
		pointer-events: auto;
	}

	:global(.subsystem-tile__overlay-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
		padding: var(--space-10);
	}

	.subsystem-tile__overlay-header {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}

	.subsystem-tile__verbs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
	}

	.subsystem-tile__extra {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	@media (prefers-reduced-motion: reduce) {
		.subsystem-tile__link {
			transition: none;
		}
	}
</style>

<!--
	@component AnatomyTile
	@module @devpulse/domains/app/models/feature/setup-wizard/ui

	A single anatomy slot in the wizard's cortex view. Composes
	`<Card preset="neuro-elevated" variant="elevated">` for the
	deep-saturated surface and consumes ColdLight primitives for
	every piece of content. No surface CSS authored here.

	## Migration (COMPOSITION-CONTRACT compliance)

	Replaces the previous 240-line hand-rolled `<style>` block
	(gradients, vignettes, shimmers, hover lifts) — that visual
	treatment now flows from the `neuro-elevated` PresetDefinition
	in `lib/design/visual/presets/neuro.ts`. This file authors
	**layout only** plus the one accent override the preset can't
	know about: the per-anatomy `--slot-accent` color used inside
	the icon-tile.

	## ARIA contract

	`role="region"` (on the outer section wrapper) +
	`aria-labelledby` pointing at the heading id. `aria-busy={state
	=== "saving"}`. The state badge area carries `aria-live="polite"`
	so AT users hear "Saving…" → "Saved" as the user works through
	tiles.

	## Token discipline

	- All color via `<Card preset>` + `color-mix(in oklch, ...)` against
	  the `--slot-accent` custom property the parent passes
	- All sizing via `clamp(min, vw, max)` so tiles breathe with
	  viewport width
	- Only ColdLight components for content (`Card`, `Badge`, `Button`,
	  `Heading`, `Text`, `Spinner`, `KeyValue`, `InlineMessage`)

	## Signal pairing

	The `onApply` handler is just a callback; the parent
	(`CortexView`) is responsible for emitting the dual-observability
	pair (`tracing::info!` on `wizard.lifecycle.apply_started` AND
	`InternalEvent::WizardTileApplied` broadcast) when this tile's
	Apply fires. See [[feedback-dual-observability]].
-->
<script lang="ts">
import { Check, Pencil } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { KeyValue } from "$lib/design/components/key-value/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";

export type ApplyState = "ready" | "saving" | "saved" | "error";

interface Props {
	/** Stable engine slot id (e.g. `vision.embedder`). Drives the
	 *  Apply callback and any signal correlation. */
	slotId: string;
	/** Lucide icon component matched to the anatomy. lucide-svelte's
	 *  class-based exports don't match Svelte 5's `Component<P>`
	 *  function form structurally — the biome-ignore matches the rest
	 *  of the codebase. */
	// biome-ignore lint/suspicious/noExplicitAny: lucide icons share a well-known props shape; narrow typing fights Svelte's generics.
	icon: any;
	/** Anatomy-themed slot name ("Eyes · what Clyffy sees"). */
	purpose: string;
	/** Tagline describing the role in one layman sentence. */
	tagline: string;
	/** Layman model name ("SigLIP HD"). Optional — populated only
	 *  when the configured backend reports a loaded model for this
	 *  slot via its capability endpoint. */
	modelName?: string;
	/** Short model tagline ("Google's compact vision encoder. Runs through Candle."). */
	modelTagline?: string;
	/** Pre-formatted size hint ("~400 MB"). Backend-reported. */
	sizeHint?: string;
	/** Optional tier label ("Recommended for this machine"). */
	tierLabel?: string;
	/** Apply lifecycle state. */
	state: ApplyState;
	/** Error message — rendered when `state === "error"`. */
	errorText?: string;
	/** Optional href for the "What is this for?" inline info link. */
	aboutHref?: string;
	/** Apply click. Parent owns the install/symlink chain. */
	onApply: () => void;
	/** Optional "Pick a different model" click. */
	onPickDifferent?: () => void;
	/** CSS custom property name for the slot accent. Must resolve
	 *  to an existing `--accent-*-main` token. */
	accentVar: string;
}

let {
	slotId,
	icon: Icon,
	purpose,
	tagline,
	modelName = undefined,
	modelTagline = undefined,
	sizeHint = undefined,
	tierLabel = undefined,
	state,
	errorText = undefined,
	aboutHref = undefined,
	onApply,
	onPickDifferent = undefined,
	accentVar,
}: Props = $props();

/** Stable id per tile so `aria-labelledby` / `aria-describedby` lock
 *  to the right heading even when several tiles render in parallel.
 *  `$derived` so the ids track if `slotId` ever changes — silences the
 *  Svelte 5 `state_referenced_locally` warning that fires when a prop
 *  is captured by value at component-init time. */
const headingId = $derived(`anatomy-tile-${slotId}-heading`);
const taglineId = $derived(`anatomy-tile-${slotId}-tagline`);

/** True when the backend has not reported a loaded model for this
 *  slot yet — the tile renders anatomy-only with a "waiting" badge
 *  and no install action. Per the preconfigured-capabilities lock:
 *  the wizard does NOT install models; it shows what the configured
 *  endpoint (local or networked GB10) is serving. */
const awaitingBackend = $derived(!modelName);

const STATE_BADGE: Record<
	ApplyState,
	{ label: string; tone: "neutral" | "informative" | "positive" | "negative" }
> = {
	ready: { label: "Ready", tone: "neutral" },
	saving: { label: "Connecting…", tone: "informative" },
	saved: { label: "Live", tone: "positive" },
	error: { label: "Couldn't connect", tone: "negative" },
};

const ctaLabel = $derived(
	state === "saving"
		? "Connecting…"
		: state === "saved"
			? "Live"
			: state === "error"
				? "Retry"
				: "Connect",
);
</script>

<section
	class="anatomy-tile"
	data-state={state}
	data-awaiting={awaitingBackend}
	style={`--slot-accent: var(${accentVar});`}
	aria-labelledby={headingId}
	aria-busy={state === "saving"}
>
	<Card preset="neuro-elevated" variant="elevated" class="anatomy-tile__shell">
		<header class="anatomy-tile__head">
			<div class="anatomy-tile__icon" aria-hidden="true">
				<Icon size={28} />
			</div>
			<div class="anatomy-tile__head-text">
				<div class="anatomy-tile__title-row">
					<Heading level={3} size="md" id={headingId}>{purpose}</Heading>
					<div class="anatomy-tile__badge-zone" aria-live="polite" aria-atomic="true">
						{#if awaitingBackend}
							<Badge variant="informative" size="sm">Awaiting backend</Badge>
						{:else}
							<Badge variant={STATE_BADGE[state].tone} size="sm">
								{STATE_BADGE[state].label}
							</Badge>
						{/if}
					</div>
				</div>
				<Text size="sm" color="muted" id={taglineId}>{tagline}</Text>
			</div>
		</header>

		{#if !awaitingBackend && modelName}
			<Card preset="glass" class="anatomy-tile__model">
				<div class="anatomy-tile__model-row">
					<Text size="base" weight="bold">{modelName}</Text>
					{#if tierLabel}
						<Badge variant="accent" size="sm">{tierLabel}</Badge>
					{/if}
				</div>
				{#if modelTagline}
					<Text size="sm" color="muted">{modelTagline}</Text>
				{/if}
				{#if sizeHint}
					<div class="anatomy-tile__model-meta">
						<KeyValue label="Loaded" value={sizeHint} size="sm" />
					</div>
				{/if}
			</Card>
		{/if}

		{#if state === "error" && errorText}
			<InlineMessage tone="error">
				<Text size="xs" weight="semibold">Connection failed</Text>
				<Text size="xs" color="muted">{errorText}</Text>
			</InlineMessage>
		{/if}

		{#if !awaitingBackend}
			<footer class="anatomy-tile__foot">
				<div class="anatomy-tile__foot-left">
					{#if onPickDifferent && state !== "saving"}
						<Button preset="ghost" size="sm" onclick={onPickDifferent}>
							<Pencil size={12} />
							Pick a different one
						</Button>
					{/if}
					{#if aboutHref}
						<a class="anatomy-tile__about" href={aboutHref} target="_blank" rel="noreferrer">
							<Text size="xs">What is this for?</Text>
						</a>
					{/if}
				</div>
				<Button
					preset={state === "saved" ? "ghost" : "primary"}
					size="md"
					onclick={onApply}
					disabled={state === "saving" || state === "saved"}
					aria-describedby={taglineId}
				>
					{#if state === "saving"}
						<Spinner size="xs" tone="accent" />
					{:else if state === "saved"}
						<Check size={14} />
					{/if}
					{ctaLabel}
				</Button>
			</footer>
		{/if}
	</Card>
</section>

<style>
	/* ── Layout-only — every surface/border/shadow/gradient
	   flows from the `neuro-elevated` PresetDefinition + the
	   inner `glass` PresetDefinition. This adapter authors:
	     • flex / grid / gap (layout)
	     • the per-anatomy `--slot-accent` accent overlay on the
	       icon-tile
	   …and nothing else. ── */

	.anatomy-tile {
		display: contents;
	}

	/* Fluid clamps interpolate on cqi (container-fluid, S1.C): the tile
	   scales with the wizard overlay (.shell-root declares the container
	   in OverlayShell), not the OS window. */
	.anatomy-tile :global(.anatomy-tile__shell) {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.4cqi, 1.125rem);
		padding: clamp(1rem, 1.8cqi, 1.5rem);
	}

	/* ── Header row — icon tile + title + state badge ── */
	.anatomy-tile__head {
		display: flex;
		gap: clamp(0.75rem, 1.4cqi, 1rem);
		align-items: flex-start;
	}

	.anatomy-tile__icon {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: clamp(2.75rem, 4cqi, 3.25rem);
		height: clamp(2.75rem, 4cqi, 3.25rem);
		border-radius: clamp(0.5rem, 1cqi, 0.75rem);
		/* The one accent override — per-anatomy color the preset
		   can't know. Resolves the `--slot-accent` the parent set
		   on `.anatomy-tile` into an oklch-mixed background + icon
		   color. Only adapter color authoring in the whole file. */
		background: color-mix(in oklch, var(--slot-accent) 32%, transparent);
		color: color-mix(in oklch, var(--slot-accent) 80%, white);
	}

	.anatomy-tile__head-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}

	.anatomy-tile__title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.anatomy-tile__badge-zone {
		min-width: 0;
	}

	/* ── Inner model panel uses the `glass` preset for its surface;
	   this adapter only adds row layout. ── */
	.anatomy-tile__model-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.anatomy-tile__model-meta {
		margin-top: 0.125rem;
	}

	/* ── Footer row — about link + Apply button ── */
	.anatomy-tile__foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.anatomy-tile__foot-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.anatomy-tile__about {
		text-decoration: none;
		color: var(--text-muted);
		opacity: 0.8;
		transition: opacity 120ms ease, color 120ms ease;
	}
	.anatomy-tile__about:hover {
		opacity: 1;
		color: color-mix(in oklch, var(--slot-accent) 60%, var(--text-muted));
	}
</style>

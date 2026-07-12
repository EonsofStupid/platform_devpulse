<!--
	@component AnatomyTile
	@module @devpulse/devtools/runtimes/orchestrator/slots/ui

	A single anatomy slot in the cortex constellation. Composes
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

	The `onApply` handler is just a callback; the SlotsDevtool is
	responsible for emitting the dual-observability pair (Rust
	`tracing::info!` + `InternalEvent` broadcast) downstream of the
	`installToSlot` chain. See [[feedback-dual-observability]].
-->
<script lang="ts">
import { Check, Pencil } from "lucide-svelte";
import type { Component } from "svelte";
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
	/** Lucide icon component matched to the anatomy (Eye / Ear /
	 *  Mic / Sparkles / BrainCircuit). Lucide icons accept more props
	 *  than the narrow `{ size?, class? }` shape (color, strokeWidth,
	 *  aria-*, …); narrowing fights the upstream type. `Component<any>`
	 *  with the biome-ignore matches the same lucide-icon convention
	 *  the rest of the codebase uses. */
	// biome-ignore lint/suspicious/noExplicitAny: lucide icons share a well-known props shape; narrow typing fights Svelte's generics.
	icon: Component<any>;
	/** Anatomy-themed slot name ("Eyes · what Clyffy sees"). */
	purpose: string;
	/** Tagline describing the role in one layman sentence. */
	tagline: string;
	/** Layman model name ("SigLIP HD"). */
	modelName: string;
	/** Short model tagline ("Google's compact vision encoder. Runs through Candle."). */
	modelTagline: string;
	/** Pre-formatted size hint ("~400 MB"). */
	sizeHint: string;
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
	modelName,
	modelTagline,
	sizeHint,
	tierLabel = undefined,
	state,
	errorText = undefined,
	aboutHref = undefined,
	onApply,
	onPickDifferent = undefined,
	accentVar,
}: Props = $props();

/** Stable id per tile so `aria-labelledby` / `aria-describedby` lock
 *  to the right heading even when several tiles render in parallel. */
const headingId = $derived(`anatomy-tile-${slotId}-heading`);
const taglineId = $derived(`anatomy-tile-${slotId}-tagline`);

const STATE_BADGE: Record<
	ApplyState,
	{ label: string; tone: "neutral" | "informative" | "positive" | "negative" }
> = {
	ready: { label: "Ready", tone: "neutral" },
	saving: { label: "Saving…", tone: "informative" },
	saved: { label: "Saved", tone: "positive" },
	error: { label: "Couldn't save", tone: "negative" },
};

const ctaLabel = $derived(
	state === "saving"
		? "Saving…"
		: state === "saved"
			? "Saved"
			: state === "error"
				? "Try again"
				: "Apply",
);
</script>

<section
	class="anatomy-tile"
	data-state={state}
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
						<Badge variant={STATE_BADGE[state].tone} size="sm">
							{STATE_BADGE[state].label}
						</Badge>
					</div>
				</div>
				<Text size="sm" color="muted" id={taglineId}>{tagline}</Text>
			</div>
		</header>

		<Card preset="glass" class="anatomy-tile__model">
			<div class="anatomy-tile__model-row">
				<Text size="base" weight="bold">{modelName}</Text>
				{#if tierLabel}
					<Badge variant="accent" size="sm">{tierLabel}</Badge>
				{/if}
			</div>
			<Text size="sm" color="muted">{modelTagline}</Text>
			<div class="anatomy-tile__model-meta">
				<KeyValue label="On disk" value={sizeHint} size="sm" />
			</div>
		</Card>

		{#if state === "error" && errorText}
			<InlineMessage tone="error">
				<Text size="xs" weight="semibold">Couldn't save this slot</Text>
				<Text size="xs" color="muted">{errorText}</Text>
			</InlineMessage>
		{/if}

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

	.anatomy-tile :global(.anatomy-tile__shell) {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.4vw, 1.125rem);
		padding: clamp(1rem, 1.8vw, 1.5rem);
	}

	/* ── Header row — icon tile + title + state badge ── */
	.anatomy-tile__head {
		display: flex;
		gap: clamp(0.75rem, 1.4vw, 1rem);
		align-items: flex-start;
	}

	.anatomy-tile__icon {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: clamp(2.75rem, 4vw, 3.25rem);
		height: clamp(2.75rem, 4vw, 3.25rem);
		border-radius: clamp(0.5rem, 1vw, 0.75rem);
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

<!--
	@component AnatomyTile
	@module @devpulse/domains/app/models/feature/setup-wizard/ui

	A single anatomy slot in the wizard's cortex view. Replaces
	[`SaveSlotCard`] for the cortex constellation — same state
	contract, but with a **deeper, accent-saturated surface** designed
	to make each slot identifiable at a glance from across the screen.

	## Design intent (the "not basic" part the user yelled for)

	Each tile paints itself via a single CSS custom property
	`--slot-accent` that the parent passes through `accentVar`. The
	tile then derives THREE gradient layers off that accent:

	1. **Base** — `linear-gradient(155deg, ...)` mixing the accent at
	   18-26% into `--surface-inset` so the tile reads as a richer,
	   deeper version of the surface (NOT the standard 5-8% kiss).
	2. **Crown** — `radial-gradient(at 30% 0%, ...)` of the accent
	   glow at ~14% alpha so the top of the tile catches light.
	3. **Vignette** — `radial-gradient(at 100% 100%, ...)` of the
	   accent main at ~6% so the bottom-right pools color.

	State transitions:

	- `ready`   — gradient as above, neutral border
	- `saving`  — additional pulsing shimmer overlay (accent-glow,
	              `prefers-reduced-motion: reduce` → static)
	- `saved`   — inset border tinted at 40% accent + ✓ glyph crowned
	              in accent-glow
	- `error`   — red strip + danger overlay, primary accent dimmed

	## ARIA contract

	`role="region"` + `aria-labelledby` pointing at the title heading
	id. `aria-busy={state === "saving"}`. The state badge area carries
	`aria-live="polite"` so AT users hear "Saving…" → "Saved" as the
	user works through tiles. The Apply button announces both its
	intent and its slot via `aria-describedby` linking back to the
	tagline.

	## Token discipline (no inline color)

	- All color via design tokens + `color-mix(in oklch, ...)`
	- All sizing via `clamp(min, vw, max)` so tiles breathe with
	  viewport width
	- Only ColdLight components for content (`Badge`, `Button`,
	  `Heading`, `Text`, `Spinner`, `KeyValue`)
	- Zero `<code>` / engineering glyphs in markup
	- Reduced-motion safe — hover lift + saving shimmer both opt out

	## Signal pairing

	The `onApply` handler is just a callback; the parent
	(`CortexView`) is responsible for emitting the dual-observability
	pair (`tracing::info!` on `wizard.lifecycle.apply_started` AND
	`InternalEvent::WizardTileApplied` broadcast) when this tile's
	Apply fires. See [[feedback-dual-observability]].
-->
<script lang="ts">
import { Check, Pencil } from "lucide-svelte";
import type { Component } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { KeyValue } from "$lib/design/components/key-value/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";

export type ApplyState = "ready" | "saving" | "saved" | "error";

interface Props {
	/** Stable kernel slot id (e.g. `vision.embedder`). Drives the
	 *  Apply callback and any signal correlation. */
	slotId: string;
	/** Lucide icon component matched to the anatomy (Eye / Ear /
	 *  Mic / Sparkles / BrainCircuit). Lucide icons accept more props
	 *  than the narrow `{ size?, class? }` shape (color, strokeWidth,
	 *  aria-*, …); narrowing fights the upstream type. `Component<any>`
	 *  with the biome-ignore matches the same lucide-icon convention
	 *  the rest of the codebase uses (see `ServiceDevtoolShell.svelte`
	 *  + the `getIcon` helper). */
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
const headingId = `anatomy-tile-${slotId}-heading`;
const taglineId = `anatomy-tile-${slotId}-tagline`;

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
	role="region"
	aria-labelledby={headingId}
	aria-busy={state === "saving"}
>
	<div class="surface-crown" aria-hidden="true"></div>
	<div class="surface-vignette" aria-hidden="true"></div>
	{#if state === "saving"}
		<div class="surface-shimmer" aria-hidden="true"></div>
	{/if}

	<header class="tile-head">
		<div class="icon-tile">
			<Icon size={28} class="anatomy-icon" />
		</div>
		<div class="head-text">
			<div class="title-row">
				<Heading level={3} size="md" id={headingId}>{purpose}</Heading>
				<div class="badge-zone" aria-live="polite" aria-atomic="true">
					<Badge variant={STATE_BADGE[state].tone} size="sm">
						{STATE_BADGE[state].label}
					</Badge>
				</div>
			</div>
			<Text size="sm" color="muted" id={taglineId}>{tagline}</Text>
		</div>
	</header>

	<section class="model-panel">
		<div class="model-name-row">
			<Text size="base" weight="bold">{modelName}</Text>
			{#if tierLabel}
				<Badge variant="accent" size="sm">{tierLabel}</Badge>
			{/if}
		</div>
		<Text size="sm" color="muted">{modelTagline}</Text>
		<div class="model-meta">
			<KeyValue label="On disk" value={sizeHint} size="sm" />
		</div>
	</section>

	{#if state === "error" && errorText}
		<div class="error-strip" role="alert">
			<Text size="xs" weight="semibold" class="error-text">
				Couldn't save this slot
			</Text>
			<Text size="xs" color="muted">{errorText}</Text>
		</div>
	{/if}

	<footer class="tile-foot">
		<div class="foot-left">
			{#if onPickDifferent && state !== "saving"}
				<Button preset="ghost" size="sm" onclick={onPickDifferent}>
					<Pencil size={12} />
					Pick a different one
				</Button>
			{/if}
			{#if aboutHref}
				<a class="about-link" href={aboutHref} target="_blank" rel="noreferrer">
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
</section>

<style>
	/* ── Tile shell — depth-stacked surface in three gradient layers ── */
	.anatomy-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.4vw, 1.125rem);
		padding: clamp(1rem, 1.8vw, 1.5rem);
		border-radius: clamp(0.75rem, 1.2vw, 1rem);
		overflow: hidden;
		isolation: isolate;
		min-width: 0;

		/* Base gradient — deep accent-saturated surface (18-26% mix
		   into the deepest base), NOT the polite 5-8% wash. */
		background:
			linear-gradient(
				155deg,
				color-mix(in oklch, var(--slot-accent) 22%, var(--surface-inset)) 0%,
				color-mix(in oklch, var(--slot-accent) 14%, var(--surface-inset)) 55%,
				color-mix(in oklch, var(--slot-accent) 26%, var(--surface-inset)) 100%
			);
		border: 0.0625rem solid
			color-mix(in oklch, var(--slot-accent) 32%, var(--border-subtle));
		box-shadow:
			0 0.5rem 1.5rem
				color-mix(in oklch, var(--slot-accent) 14%, transparent),
			0 0.125rem 0.375rem
				color-mix(in oklch, var(--slot-accent) 18%, transparent),
			inset 0 0.0625rem 0
				color-mix(in oklch, var(--slot-accent) 22%, transparent);

		transition:
			border-color 180ms ease,
			box-shadow 180ms ease,
			transform 180ms ease;
	}

	.anatomy-tile:hover {
		border-color: color-mix(in oklch, var(--slot-accent) 55%, var(--border-subtle));
		box-shadow:
			0 0.75rem 2rem
				color-mix(in oklch, var(--slot-accent) 22%, transparent),
			0 0.25rem 0.5rem
				color-mix(in oklch, var(--slot-accent) 26%, transparent),
			inset 0 0.0625rem 0
				color-mix(in oklch, var(--slot-accent) 34%, transparent);
		transform: translateY(-0.125rem);
	}

	/* Crown layer — radial glow at top-left mimics light catching the
	   surface. Behind everything via z-index 0. */
	.surface-crown {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: radial-gradient(
			circle at 30% 0%,
			color-mix(in oklch, var(--slot-accent) 28%, transparent) 0%,
			transparent 55%
		);
		opacity: 0.6;
	}

	/* Vignette layer — bottom-right accent pool. */
	.surface-vignette {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse at 100% 100%,
			color-mix(in oklch, var(--slot-accent) 18%, transparent) 0%,
			transparent 60%
		);
		opacity: 0.7;
	}

	/* Shimmer — only while saving. Sweeping highlight from left to
	   right at 1.6s. Honors reduced-motion. */
	.surface-shimmer {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
		background: linear-gradient(
			110deg,
			transparent 35%,
			color-mix(in oklch, var(--slot-accent) 22%, transparent) 50%,
			transparent 65%
		);
		background-size: 220% 100%;
		animation: shimmer-sweep 1.6s ease-in-out infinite;
	}

	@keyframes shimmer-sweep {
		0% { background-position: 200% 0; }
		100% { background-position: -100% 0; }
	}

	/* Saved state — inset highlight + slight accent lift. */
	.anatomy-tile[data-state="saved"] {
		border-color: color-mix(in oklch, var(--slot-accent) 50%, var(--border-subtle));
		box-shadow:
			0 0.5rem 1.5rem
				color-mix(in oklch, var(--slot-accent) 18%, transparent),
			inset 0 0 0 0.0625rem
				color-mix(in oklch, var(--slot-accent) 38%, transparent);
	}

	/* Error state — danger overlay on the top strip. */
	.anatomy-tile[data-state="error"] {
		border-color: color-mix(in oklch, var(--accent-danger-main) 50%, var(--border-subtle));
	}

	/* All inner content sits above the gradient layers. */
	.tile-head,
	.model-panel,
	.error-strip,
	.tile-foot {
		position: relative;
		z-index: 1;
	}

	/* ── Header row — icon tile + title + state badge ── */
	.tile-head {
		display: flex;
		gap: clamp(0.75rem, 1.4vw, 1rem);
		align-items: flex-start;
	}

	.icon-tile {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: clamp(2.75rem, 4vw, 3.25rem);
		height: clamp(2.75rem, 4vw, 3.25rem);
		border-radius: clamp(0.5rem, 1vw, 0.75rem);
		background: color-mix(
			in oklch,
			var(--slot-accent) 32%,
			var(--surface-inset)
		);
		border: 0.0625rem solid
			color-mix(in oklch, var(--slot-accent) 45%, var(--border-subtle));
		color: color-mix(in oklch, var(--slot-accent) 80%, white);
		box-shadow:
			inset 0 0.0625rem 0
				color-mix(in oklch, var(--slot-accent) 28%, transparent);
	}

	.anatomy-tile :global(.anatomy-icon) {
		color: inherit;
	}

	.head-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
		flex: 1;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.badge-zone {
		min-width: 0;
	}

	/* ── Model panel — inner well, slight depth from accent ── */
	.model-panel {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: clamp(0.625rem, 1.2vw, 0.875rem);
		border-radius: clamp(0.5rem, 0.8vw, 0.625rem);
		background: color-mix(
			in oklch,
			var(--slot-accent) 6%,
			var(--surface-inset)
		);
		border: 0.0625rem solid
			color-mix(in oklch, var(--slot-accent) 20%, var(--border-subtle));
	}

	.model-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	.model-meta {
		margin-top: 0.125rem;
	}

	/* ── Error strip ── */
	.error-strip {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: clamp(0.5rem, 1vw, 0.75rem);
		border-radius: 0.5rem;
		background: color-mix(
			in oklch,
			var(--accent-danger-main) 16%,
			var(--surface-inset)
		);
		border: 0.0625rem solid
			color-mix(in oklch, var(--accent-danger-main) 35%, var(--border-subtle));
	}

	.anatomy-tile :global(.error-text) {
		color: var(--accent-danger-main);
	}

	/* ── Footer row — about + Apply ── */
	.tile-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.foot-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.about-link {
		text-decoration: none;
		color: var(--text-muted);
		opacity: 0.8;
		transition: opacity 120ms ease, color 120ms ease;
	}
	.about-link:hover {
		opacity: 1;
		color: color-mix(in oklch, var(--slot-accent) 60%, var(--text-muted));
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.anatomy-tile,
		.anatomy-tile:hover {
			transition: none;
			transform: none;
		}
		.surface-shimmer {
			animation: none;
			background: color-mix(in oklch, var(--slot-accent) 14%, transparent);
		}
	}
</style>

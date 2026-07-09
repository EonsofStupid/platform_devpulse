<!--
	@component SaveSlotCard
	@module @devpulse/domains/app/models/feature/setup-wizard/ui

	Single polished card for "save this model to this slot" in the
	customer-facing setup wizard. Customer reads one card, hits Save,
	the model lands in the slot. No engineering vocabulary, no buried
	flags, no shared CTA — each slot gets its own card with its own
	Save button so progress is visible per row.

	## Composition

	Mirrors the visual DNA of [`StoreHeroCard`] + [`EngineFoundationCard`]
	but tuned for the wizard surface:

	  - Per-slot accent stripe + icon tile (caller passes `accentVar`)
	  - Layman header: slot purpose, not slot id
	  - Body: model name + tagline + size hint
	  - Footer: primary Save button + secondary "pick a different one"
	  - Status badge swaps in-flight feedback (saving / saved / error)

	## Polish discipline

	  - All sizing via `clamp(min, vw, max)` so the card breathes
	  - Color via design tokens + `color-mix(in oklch, <accent>, ...)`
	  - No inline Tailwind grids or color classes
	  - Only ColdLight components for content: `Text`, `Heading`,
	    `Button`, `Badge`, `KeyValue`, `Spinner`
	  - No raw `<code>` / `<strong>` / engineering glyphs in markup
	  - Layman copy only — engineer-grade tooltips live behind the
	    `aboutHref` info link

	## State contract

	Caller owns state — the card is presentational. `state` drives the
	save-button label, badge tone, and disabled state.
-->
<script lang="ts">
import { Check, Pencil } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { KeyValue } from "$lib/design/components/key-value/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";

export type SaveState = "ready" | "saving" | "saved" | "error";

interface Props {
	/**
	 * Lucide icon component for the slot. Typed `any` because
	 * lucide-svelte v0.564 exports class-based icons
	 * (`SvelteComponentTyped<…>`), which structurally don't satisfy
	 * Svelte 5's function-form `Component<P, E, S>`. Narrow typing
	 * here causes assignment errors at every caller.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: lucide-svelte class-based exports don't match Svelte 5 `Component<P>` function-form structurally.
	icon: any;
	/** Layman slot purpose (e.g. "Vision · what Clyffy sees"). */
	purpose: string;
	/** One-line role description (e.g. "Encodes screenshots and uploads
	 *  so Clyffy can reason about images"). */
	tagline: string;
	/** Layman model name (e.g. "SigLIP HD"). Absent when no model is
	 *  assigned yet — a slot's model comes from Clyffy's
	 *  advertised capability, not a local install, so it may be unresolved. */
	modelName?: string;
	/** Short model tagline (e.g. "Google's compact vision encoder"). Absent with modelName. */
	modelTagline?: string;
	/** On-disk size hint (e.g. "~400 MB"). Absent until a model is resolved. */
	sizeHint?: string;
	/** Optional tier label (e.g. "Recommended for this machine"). */
	tierLabel?: string;
	/** Save lifecycle state. */
	state: SaveState;
	/** Optional error message — rendered when `state === "error"`. */
	errorText?: string;
	/** Optional href for the "What is this for?" info link. */
	aboutHref?: string;
	/** Save button click. */
	onSave: () => void;
	/** "Pick a different model" click — opens the model browser overlay. */
	onPickDifferent?: () => void;
	/** Accent CSS variable name. Must be defined in the global token set. */
	accentVar: string;
}

let {
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
	onSave,
	onPickDifferent = undefined,
	accentVar,
}: Props = $props();

const STATE_BADGE: Record<
	SaveState,
	{ label: string; tone: "neutral" | "informative" | "positive" | "negative" }
> = {
	ready: { label: "Ready to save", tone: "neutral" },
	saving: { label: "Saving…", tone: "informative" },
	saved: { label: "Saved", tone: "positive" },
	error: { label: "Couldn't save", tone: "negative" },
};

const buttonLabel = $derived(
	state === "saving"
		? "Saving…"
		: state === "saved"
			? "Saved"
			: state === "error"
				? "Try again"
				: "Save this model",
);
</script>

<article class="slot-card" style={`--slot-accent: var(${accentVar});`}>
	<div class="accent-stripe"></div>

	<div class="slot-body">
		<header class="slot-header">
			<div class="icon-tile">
				<Icon size={28} class="slot-icon" />
			</div>
			<div class="header-text">
				<div class="title-row">
					<Heading level={3} size="md">{purpose}</Heading>
					<Badge variant={STATE_BADGE[state].tone} size="sm">
						{STATE_BADGE[state].label}
					</Badge>
				</div>
				<Text size="sm" color="muted">{tagline}</Text>
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
			{#if sizeHint}
				<div class="model-meta">
					<KeyValue label="On disk" value={sizeHint} size="sm" />
				</div>
			{/if}
		</section>

		{#if state === "error" && errorText}
			<div class="error-strip">
				<Text size="xs" weight="semibold" class="error-text">
					Couldn't save this slot
				</Text>
				<Text size="xs" color="muted">{errorText}</Text>
			</div>
		{/if}

		<footer class="slot-footer">
			<div class="footer-left">
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
				onclick={onSave}
				disabled={state === "saving" || state === "saved"}
			>
				{#if state === "saving"}
					<Spinner size="xs" tone="accent" />
				{:else if state === "saved"}
					<Check size={14} />
				{/if}
				{buttonLabel}
			</Button>
		</footer>
	</div>
</article>

<style>
	.slot-card {
		position: relative;
		display: flex;
		border-radius: 0.75rem;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			var(--surface-raised) 0%,
			color-mix(in oklch, var(--slot-accent) 5%, var(--surface-raised)) 100%
		);
		border: 1px solid color-mix(in oklch, var(--slot-accent) 28%, var(--border-subtle));
		box-shadow:
			0 0.125rem 0.5rem color-mix(in oklch, var(--slot-accent) 8%, transparent),
			0 0.0625rem 0.125rem color-mix(in oklch, var(--slot-accent) 12%, transparent);
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}
	.slot-card:hover {
		border-color: color-mix(in oklch, var(--slot-accent) 45%, var(--border-subtle));
		box-shadow:
			0 0.25rem 1rem color-mix(in oklch, var(--slot-accent) 12%, transparent),
			0 0.0625rem 0.25rem color-mix(in oklch, var(--slot-accent) 18%, transparent);
	}
	.accent-stripe {
		width: 0.3125rem;
		background: linear-gradient(
			180deg,
			var(--slot-accent) 0%,
			color-mix(in oklch, var(--slot-accent) 55%, transparent) 100%
		);
		flex-shrink: 0;
	}
	.slot-body {
		flex: 1;
		padding: clamp(1rem, 1.6vw, 1.5rem);
		display: flex;
		flex-direction: column;
		gap: clamp(0.875rem, 1.4vw, 1.25rem);
		min-width: 0;
	}

	.slot-header {
		display: flex;
		align-items: flex-start;
		gap: clamp(0.75rem, 1.2vw, 1rem);
	}
	.icon-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		width: clamp(2.75rem, 4vw, 3.25rem);
		height: clamp(2.75rem, 4vw, 3.25rem);
		border-radius: 0.625rem;
		background: color-mix(in oklch, var(--slot-accent) 14%, transparent);
		border: 1px solid color-mix(in oklch, var(--slot-accent) 32%, transparent);
		flex-shrink: 0;
	}
	:global(.slot-icon) {
		color: var(--slot-accent);
	}
	.header-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.model-panel {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: clamp(0.75rem, 1.2vw, 1rem);
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--slot-accent) 5%, var(--surface-base));
		border: 1px solid var(--border-subtle);
	}
	.model-name-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}
	.model-meta {
		margin-top: 0.25rem;
	}

	.error-strip {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: clamp(0.625rem, 1vw, 0.875rem);
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--signal-error) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);
	}
	:global(.error-text) {
		color: var(--signal-error);
	}

	.slot-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: clamp(0.5rem, 1vw, 0.875rem);
		flex-wrap: wrap;
		padding-top: clamp(0.25rem, 0.5vw, 0.5rem);
		border-top: 1px dashed var(--border-subtle);
	}
	.footer-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.about-link {
		display: inline-flex;
		align-items: center;
		color: var(--slot-accent);
		text-decoration: none;
		padding: 0.125rem 0;
		border-bottom: 1px solid transparent;
		transition: border-color 120ms ease;
	}
	.about-link:hover {
		border-bottom-color: color-mix(in oklch, var(--slot-accent) 55%, transparent);
	}
</style>

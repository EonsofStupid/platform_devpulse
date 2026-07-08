<!--
	@file CortexView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/cortex

	Customer-facing cortex setup step. Renders five [`AnatomyTile`]s
	arranged through [`AnatomyConstellation`] — Eyes, Ears, Mouth,
	Sparkles (minion), Brain — so the customer sees Clyffy's cortex
	as a body diagram, not a list.

	Replaces the previous `SlotSaveView` for the wizard's cortex
	step. `SlotSaveView` stays in the codebase for any non-wizard
	consumer that wants the simpler vertical-stack card list.

	## Polish discipline (the "not basic" part)

	  - Layout via [`AnatomyConstellation`] — chest-piece CSS grid
	  - Every tile paints its own deep-accent gradient surface
	  - All color via design tokens + `color-mix(in oklch, ...)`
	  - All sizing via `clamp()` in scoped `<style>`
	  - No inline Tailwind grids, no `<code>`, no engineer glyphs
	  - Layman copy only (slot taglines pre-translated by SLOT_LAYMAN
	    in `SetupWizardOverlay.svelte`)
	  - Each tile is independently interactive — Apply fires for
	    that one slot only

	## Slot ↔ Anatomy mapping (locked)

	| Anatomy   | Tile key            | Wire match (capability)  |
	|-----------|---------------------|--------------------------|
	| Eyes      | `vision.embedder`   | role `vision`            |
	| Ears      | `voice.stt`         | slot `voice`             |
	| Mouth     | `voice.tts`         | slot `voice`             |
	| Sparkles  | `rag.embedder`      | slot `rag_embed`         |
	| Brain     | `chat.brain`        | slot `clyffy`            |

	(Reconciled 2026-07-08 — this table previously said Sparkles →
	`minion.shared`, drifted from the code's `rag.embedder`. Model
	names come from the connected endpoint's capability, never a
	hardcoded default column.)

	The mapping uses anatomy ICONS, not the slot ids — the parent
	view (`SetupWizardOverlay`) is the one that joins tile keys to
	the anatomy-themed copy + wire matchers via its SLOT_LAYMAN table.

	## Signal contract

	`onApplySlot(slotId)` routes to the endpoint (connect) step — the
	tiles light up from the connected endpoint's capability; they do
	not install anything. This view is presentational — it does not
	fire tracing of its own.
-->
<script lang="ts">
import { BrainCircuit, ChevronRight, Ear, Eye, Mic, Sparkles } from "lucide-svelte";
import { ClyffyMascot } from "$lib/design/blocks/clyffy/index.js";
import { KnowledgeTermStrip } from "$lib/design/blocks/knowledge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import AnatomyConstellation from "../../ui/AnatomyConstellation.svelte";
import AnatomyTile from "../../ui/AnatomyTile.svelte";
import type { CortexViewProps, SlotSaveEntryProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let {
	slotSaves,
	title,
	subtitle,
	busy,
	onApplySlot,
	onPickDifferent = undefined,
	callbacks,
}: CortexViewProps = $props();

/**
 * Resolve a kernel-supplied icon name to a lucide component. Lives
 * here so the typed prop struct (`SlotSaveEntryProps`) stays
 * JSON-serializable — callable components can't cross the typed-state
 * boundary cleanly.
 */
const ICON_MAP = { Eye, Ear, Mic, Sparkles, BrainCircuit } as const;

/** Anatomy → slot id binding. Used to look the right entry up out
 *  of the unordered `slotSaves[]` array per cell. Falls back to
 *  undefined if the parent's SLOT_LAYMAN omits one (visible gap
 *  rather than silent drop).
 *
 *  Sparkles maps to `rag.embedder` — the user-visible action saves
 *  Harrier 0.6B as the indexing encoder/embedder. SetupWizardOverlay's
 *  `saveOneSlot` runs the install chain for BOTH `rag.embedder` and
 *  `rag.encoder` when this tile fires (Harrier 0.6B ref-counts on the
 *  BackendPool, so the save covers the full retrieval pair). */
const SLOT_BY_ANATOMY = {
	brain: "chat.brain",
	sparkles: "rag.embedder",
	eyes: "vision.embedder",
	ears: "voice.stt",
	mouth: "voice.tts",
} as const;

const findEntry = (slotId: string): SlotSaveEntryProps | undefined =>
	slotSaves.find((s) => s.kernelSlotId === slotId);
</script>

<OverlayShell label="DevPulse setup — cortex" step={2} totalSteps={2} {title}>
	{#snippet mascot()}
		<ClyffyMascot pose="pointing" size="lg" />
	{/snippet}

	<div class="cortex-view">
		<header class="cortex-header">
			<Heading level={2} size="md">{title}</Heading>
			<Text size="sm" color="muted">{subtitle}</Text>
			<KnowledgeTermStrip
				caption="What these words mean:"
				tool="wizard"
				terms={["slot", "Brain", "Minion", "Embedder", "VRAM", "preset"]}
			/>
		</header>

		<AnatomyConstellation>
			{#snippet brain()}
				{@const entry = findEntry(SLOT_BY_ANATOMY.brain)}
				{#if entry}
					<AnatomyTile
						slotId={entry.kernelSlotId}
						icon={ICON_MAP[entry.iconName]}
						purpose={entry.purpose}
						tagline={entry.tagline}
						modelName={entry.modelName}
						modelTagline={entry.modelTagline}
						sizeHint={entry.sizeHint}
						tierLabel={entry.tierLabel}
						aboutHref={entry.aboutHref}
						state={entry.state}
						errorText={entry.errorText}
						accentVar={entry.accentVar}
						onApply={() => onApplySlot(entry.kernelSlotId)}
						onPickDifferent={onPickDifferent
							? () => onPickDifferent(entry.kernelSlotId)
							: undefined}
					/>
				{/if}
			{/snippet}
			{#snippet sparkles()}
				{@const entry = findEntry(SLOT_BY_ANATOMY.sparkles)}
				{#if entry}
					<AnatomyTile
						slotId={entry.kernelSlotId}
						icon={ICON_MAP[entry.iconName]}
						purpose={entry.purpose}
						tagline={entry.tagline}
						modelName={entry.modelName}
						modelTagline={entry.modelTagline}
						sizeHint={entry.sizeHint}
						tierLabel={entry.tierLabel}
						aboutHref={entry.aboutHref}
						state={entry.state}
						errorText={entry.errorText}
						accentVar={entry.accentVar}
						onApply={() => onApplySlot(entry.kernelSlotId)}
						onPickDifferent={onPickDifferent
							? () => onPickDifferent(entry.kernelSlotId)
							: undefined}
					/>
				{/if}
			{/snippet}
			{#snippet eyes()}
				{@const entry = findEntry(SLOT_BY_ANATOMY.eyes)}
				{#if entry}
					<AnatomyTile
						slotId={entry.kernelSlotId}
						icon={ICON_MAP[entry.iconName]}
						purpose={entry.purpose}
						tagline={entry.tagline}
						modelName={entry.modelName}
						modelTagline={entry.modelTagline}
						sizeHint={entry.sizeHint}
						tierLabel={entry.tierLabel}
						aboutHref={entry.aboutHref}
						state={entry.state}
						errorText={entry.errorText}
						accentVar={entry.accentVar}
						onApply={() => onApplySlot(entry.kernelSlotId)}
						onPickDifferent={onPickDifferent
							? () => onPickDifferent(entry.kernelSlotId)
							: undefined}
					/>
				{/if}
			{/snippet}
			{#snippet ears()}
				{@const entry = findEntry(SLOT_BY_ANATOMY.ears)}
				{#if entry}
					<AnatomyTile
						slotId={entry.kernelSlotId}
						icon={ICON_MAP[entry.iconName]}
						purpose={entry.purpose}
						tagline={entry.tagline}
						modelName={entry.modelName}
						modelTagline={entry.modelTagline}
						sizeHint={entry.sizeHint}
						tierLabel={entry.tierLabel}
						aboutHref={entry.aboutHref}
						state={entry.state}
						errorText={entry.errorText}
						accentVar={entry.accentVar}
						onApply={() => onApplySlot(entry.kernelSlotId)}
						onPickDifferent={onPickDifferent
							? () => onPickDifferent(entry.kernelSlotId)
							: undefined}
					/>
				{/if}
			{/snippet}
			{#snippet mouth()}
				{@const entry = findEntry(SLOT_BY_ANATOMY.mouth)}
				{#if entry}
					<AnatomyTile
						slotId={entry.kernelSlotId}
						icon={ICON_MAP[entry.iconName]}
						purpose={entry.purpose}
						tagline={entry.tagline}
						modelName={entry.modelName}
						modelTagline={entry.modelTagline}
						sizeHint={entry.sizeHint}
						tierLabel={entry.tierLabel}
						aboutHref={entry.aboutHref}
						state={entry.state}
						errorText={entry.errorText}
						accentVar={entry.accentVar}
						onApply={() => onApplySlot(entry.kernelSlotId)}
						onPickDifferent={onPickDifferent
							? () => onPickDifferent(entry.kernelSlotId)
							: undefined}
					/>
				{/if}
			{/snippet}
		</AnatomyConstellation>
	</div>

	{#snippet footer()}
		<Button preset="ghost" size="sm" onclick={callbacks.onSkip} disabled={busy}>
			Set up backend later
		</Button>
		<div class="footer-spacer"></div>
		<Button preset="primary" size="md" onclick={callbacks.onNext} disabled={busy}>
			{#if busy}<Spinner size="xs" tone="accent" />{/if}
			Continue
			<ChevronRight size={14} />
		</Button>
	{/snippet}
</OverlayShell>

<style>
	.cortex-view {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2vw, 1.75rem);
		min-width: 0;
	}
	.cortex-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		text-align: center;
		max-width: 48rem;
		margin-inline: auto;
	}
	.footer-spacer {
		flex: 1;
	}
</style>

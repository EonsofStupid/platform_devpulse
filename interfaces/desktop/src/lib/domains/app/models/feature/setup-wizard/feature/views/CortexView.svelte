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

	| Anatomy   | Kernel slot         | Engine    | Default model |
	|-----------|---------------------|-----------|---------------|
	| Eyes      | `vision.embedder`   | Candle    | SigLIP HD     |
	| Ears      | `voice.stt`         | Sherpa    | Whisper       |
	| Mouth     | `voice.tts`         | Sherpa    | Kokoro        |
	| Sparkles  | `minion.shared`     | Burn      | Harrier 0.6B  |
	| Brain     | `chat.brain`        | llama.cpp | Nemotron 7.6B |

	The mapping uses anatomy ICONS, not the slot ids — the parent
	view (`SetupWizardOverlay`) is the one that joins kernel slot
	ids to the anatomy-themed copy via its SLOT_LAYMAN table.

	## Signal contract

	`onApplySlot(slotId)` triggers the full install chain in the
	parent (download → symlink → load). The parent emits BOTH the
	`wizard.lifecycle.*` tracing AND the `WizardTileApplied` /
	`WizardSymlinkArmed` `InternalEvent` per
	[[feedback-dual-observability]]. This view is presentational —
	it does not fire tracing of its own.
-->
<script lang="ts">
import { ClyffyMascot } from "@devpulse/coldlight/blocks/clyffy";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { BrainCircuit, ChevronRight, Ear, Eye, Mic, Sparkles } from "lucide-svelte";
import { KnowledgeTermStrip } from "$lib/domains/app/knowledge/index.js";
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
	onApplyAll,
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

const allSaved = $derived(slotSaves.length > 0 && slotSaves.every((s) => s.state === "saved"));
const anyUnsaved = $derived(slotSaves.some((s) => s.state !== "saved"));
</script>

<OverlayShell label="DevPulse setup — cortex" step={1} totalSteps={1} {title} width="wide">
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
			Skip — assign manually later
		</Button>
		<div class="footer-spacer"></div>
		{#if anyUnsaved}
			<Button preset="primary" size="md" onclick={onApplyAll} disabled={busy}>
				{#if busy}<Spinner size="xs" tone="accent" />{/if}
				Apply all
				<ChevronRight size={14} />
			</Button>
		{:else}
			<Button
				preset="primary"
				size="md"
				onclick={callbacks.onFinish}
				disabled={busy || !allSaved}
			>
				{#if busy}<Spinner size="xs" tone="accent" />{/if}
				Done
				<ChevronRight size={14} />
			</Button>
		{/if}
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

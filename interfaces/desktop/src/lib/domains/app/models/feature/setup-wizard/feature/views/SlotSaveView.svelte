<!--
	@file SlotSaveView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/slot-save

	Customer-facing per-slot save view. Renders one [`SaveSlotCard`]
	for each of the three foundation slots so the customer can confirm
	(or swap) each model AND see per-slot progress as they hit Save.

	Replaces / complements the all-or-nothing PresetView. PresetView
	stays for "Install everything at once" workflows; this view is for
	the customer who wants to understand and confirm each piece.

	## Slots in this view (foundation baseline — locked)

	| Order | Slot purpose                       | Default model    | Accent           |
	|-------|------------------------------------|------------------|------------------|
	| 1     | Vision · what Clyffy sees          | SigLIP HD        | `--accent-cyan`  |
	| 2     | Quick thinking · Clyffy's minion   | Harrier 0.6B     | `--accent-hotpink` |
	| 3     | Deep reasoning · the long-think    | Nemotron 7.6B    | `--accent-amber` |

	The slot IDs themselves are engine-side
	([SlotRecommendation`s][`SlotRecommendation`]). This view's
	`slotSaves` prop maps each engine recommendation to a customer-
	friendly preset by `slot_id`.

	## Polish discipline

	  - Layout via scoped `<style>` clamp() — no inline Tailwind grids
	  - All colour via design tokens + per-slot accent variable
	  - Layman copy throughout (no slot_id, no repo_id strings)
	  - Each card is independently interactive — Save fires for that
	    one slot only
-->
<script lang="ts">
import { BrainCircuit, ChevronRight, Ear, Eye, Mic, Sparkles } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import SaveSlotCard, { type SaveState } from "../../ui/SaveSlotCard.svelte";
import type { SlotSaveViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let {
	slotSaves,
	title,
	subtitle,
	busy,
	onSaveSlot,
	onPickDifferent = undefined,
	onSaveAll,
	callbacks,
}: SlotSaveViewProps = $props();

/**
 * Resolve an engine-supplied icon name to a lucide component. Lives
 * here so the typed prop struct stays JSON-serializable (callable
 * components can't cross the typed-state boundary cleanly).
 */
const ICON_MAP = { Eye, Ear, Mic, Sparkles, BrainCircuit } as const;

const allSaved = $derived(slotSaves.every((s) => s.state === "saved"));
const anyUnsaved = $derived(slotSaves.some((s) => s.state !== "saved"));
</script>

<OverlayShell label="DevPulse setup — save starter models" step={4} totalSteps={6} {title}>
	<div class="slot-save-view">
		<header class="header">
			<Heading level={2} size="md">{title}</Heading>
			<Text size="sm" color="muted">{subtitle}</Text>
		</header>

		<div class="cards">
			{#each slotSaves as entry (entry.kernelSlotId)}
				<SaveSlotCard
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
					onSave={() => onSaveSlot(entry.kernelSlotId)}
					onPickDifferent={onPickDifferent ? () => onPickDifferent(entry.kernelSlotId) : undefined}
				/>
			{/each}
		</div>
	</div>

	{#snippet footer()}
		<Button preset="ghost" size="sm" onclick={callbacks.onBack} disabled={busy}>
			Back
		</Button>
		<Button preset="ghost" size="sm" onclick={callbacks.onSkip} disabled={busy}>
			Skip — assign manually later
		</Button>
		<div class="footer-spacer"></div>
		{#if anyUnsaved}
			<Button preset="ghost" size="sm" onclick={onSaveAll} disabled={busy}>
				{#if busy}<Spinner size="xs" tone="accent" />{/if}
				Save all
			</Button>
		{/if}
		<Button preset="primary" size="md" onclick={callbacks.onNext} disabled={busy || !allSaved}>
			{#if busy}<Spinner size="xs" tone="accent" />{/if}
			Continue
			<ChevronRight size={14} />
		</Button>
	{/snippet}
</OverlayShell>

<style>
	.slot-save-view {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 1.8vw, 1.5rem);
		min-width: 0;
	}
	.header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.cards {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.4vw, 1.125rem);
	}
	.footer-spacer {
		flex: 1;
	}
</style>

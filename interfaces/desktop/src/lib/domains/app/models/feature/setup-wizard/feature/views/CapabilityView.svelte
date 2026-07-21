<!--
	@file CapabilityView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/capability

	Wizard step 2 — the capability confirm view. Renders the CONNECTED
	Clyffy's advertised senses as layman anatomy tiles (Eyes / Ears /
	Mouth / Sparkles / Brain via AnatomyConstellation). Everything on
	this screen is a pure function of the live wire capability
	(`clyffyConnection.slots`) — honest empty when standalone. There is
	no embedded kernel: Clyffy is reached over the wire (ClyffyOS).

	Replaces the pre-severance step-2 view (2026-07-14, 08/R5): zero
	hardcoded English — copy is the `[capability]` SSOT table; tooltips
	on every tile + footer action.

	## Slot ↔ Anatomy mapping (locked)

	| Anatomy   | Tile key            | Wire match (capability)  |
	|-----------|---------------------|--------------------------|
	| Eyes      | `vision.embedder`   | role `vision`            |
	| Ears      | `voice.stt`         | slot `voice`             |
	| Mouth     | `voice.tts`         | slot `voice`             |
	| Sparkles  | `rag.embedder`      | slot `rag_embed`         |
	| Brain     | `chat.brain`        | slot `clyffy`            |

	`onApplySlot` routes to the endpoint (connect) step — tiles light up
	from the connected endpoint's capability; they never install.
-->
<script lang="ts">
import { BrainCircuit, ChevronRight, Ear, Eye, Mic, Sparkles } from "@lucide/svelte";
import { ClyffyMascot } from "$lib/design/blocks/clyffy/index.js";
import { KnowledgeTermStrip } from "$lib/design/blocks/knowledge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import AnatomyConstellation from "../../ui/AnatomyConstellation.svelte";
import AnatomyTile from "../../ui/AnatomyTile.svelte";
import type { CapabilityViewProps, SlotSaveEntryProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, connected, slotSaves, busy, onApplySlot, callbacks }: CapabilityViewProps = $props();

/** Engine icon name → lucide component (typed props stay serializable). */
const ICON_MAP = { Eye, Ear, Mic, Sparkles, BrainCircuit } as const;

/** Anatomy → slot id binding (locked table above). */
const SLOT_BY_ANATOMY = {
	brain: "chat.brain",
	sparkles: "rag.embedder",
	eyes: "vision.embedder",
	ears: "voice.stt",
	mouth: "voice.tts",
} as const;

/** Anatomy → its [capability] SSOT tooltip. */
const TIP_BY_ANATOMY: Record<keyof typeof SLOT_BY_ANATOMY, () => string> = {
	brain: () => copy?.tile_brain_tip ?? "",
	sparkles: () => copy?.tile_sparkles_tip ?? "",
	eyes: () => copy?.tile_eyes_tip ?? "",
	ears: () => copy?.tile_ears_tip ?? "",
	mouth: () => copy?.tile_mouth_tip ?? "",
};

const findEntry = (slotId: string): SlotSaveEntryProps | undefined =>
	slotSaves.find((s) => s.kernelSlotId === slotId);
</script>

{#snippet tile(anatomy: keyof typeof SLOT_BY_ANATOMY)}
	{@const entry = findEntry(SLOT_BY_ANATOMY[anatomy])}
	{#if entry}
		<Tooltip>
			<TooltipTrigger class="capability-tile-trigger">
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
				/>
			</TooltipTrigger>
			<TooltipContent preset="stark">{TIP_BY_ANATOMY[anatomy]()}</TooltipContent>
		</Tooltip>
	{/if}
{/snippet}

<OverlayShell
	label={copy?.title ?? ""}
	step={2}
	totalSteps={2}
	title={copy?.title ?? ""}
>
	{#snippet mascot()}
		<ClyffyMascot pose="pointing" size="lg" />
	{/snippet}

	<div class="capability-view">
		<header class="capability-header">
			<!-- Title lives in the shell's header card — no duplicate here. -->
			<Text size="sm" color="muted">{copy?.subtitle ?? ""}</Text>
			{#if !connected}
				<Text size="xs" color="muted">{copy?.standalone_hint ?? ""}</Text>
			{/if}
			<KnowledgeTermStrip
				caption={copy?.terms_caption ?? ""}
				tool="wizard"
				terms={["slot", "Brain", "Minion", "Embedder", "VRAM", "preset"]}
			/>
		</header>

		<AnatomyConstellation>
			{#snippet brain()}{@render tile("brain")}{/snippet}
			{#snippet sparkles()}{@render tile("sparkles")}{/snippet}
			{#snippet eyes()}{@render tile("eyes")}{/snippet}
			{#snippet ears()}{@render tile("ears")}{/snippet}
			{#snippet mouth()}{@render tile("mouth")}{/snippet}
		</AnatomyConstellation>
	</div>

	{#snippet footer()}
		<Tooltip>
			<TooltipTrigger>
				<Button preset="ghost" size="sm" onclick={callbacks.onBack} disabled={busy}>
					{copy?.back_label ?? ""}
				</Button>
			</TooltipTrigger>
			<TooltipContent preset="stark">{copy?.back_tooltip ?? ""}</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				<Button preset="ghost" size="sm" onclick={callbacks.onSkip} disabled={busy}>
					{copy?.skip_label ?? ""}
				</Button>
			</TooltipTrigger>
			<TooltipContent preset="stark">{copy?.skip_tooltip ?? ""}</TooltipContent>
		</Tooltip>
		<div class="footer-spacer"></div>
		<Tooltip>
			<TooltipTrigger>
				<Button preset="primary" size="md" onclick={callbacks.onNext} disabled={busy}>
					{#if busy}<Spinner size="xs" tone="accent" />{/if}
					{copy?.continue_label ?? ""}
					<ChevronRight size={14} />
				</Button>
			</TooltipTrigger>
			<TooltipContent preset="stark">{copy?.continue_tooltip ?? ""}</TooltipContent>
		</Tooltip>
	{/snippet}
</OverlayShell>

<style>
	/* LAYOUT ONLY — tiles own their chrome via AnatomyTile's chain. */
	.capability-view {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2cqi, 1.75rem);
		min-width: 0;
	}

	.capability-header {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		text-align: center;
		max-width: 48rem;
		margin-inline: auto;
	}

	:global(.capability-tile-trigger) {
		display: flex;
		min-width: 0;
	}

	.footer-spacer {
		flex: 1;
	}
</style>

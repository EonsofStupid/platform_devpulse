<!--
  @file ConfigView.svelte
  @domain models/setup-wizard

  View 3 of the 5-view setup wizard. Absorbs Step2Brain + Step3Encoder +
  Step4Voice + Step5Helpers — ALL 13 slots across 4 role groups.

  Tabbed layout (Brain / Encoder / Voice / Helpers):
  - Brain tab: BrainCard (chat.brain — rich size selector + per-slot Apply)
  - Encoder tab: MemoryCard (rag.embedder — primary) + SlotCard for
    rag.reranker, rag.encoder, vision.embedder
  - Voice tab: VoiceCard (voice.stt + voice.tts — primary) + SlotCard for
    voice.brain, voice.wake
  - Helpers tab: SlotCard for minion.shared, minion.escalation,
    chat.fast, chat.vision (all optional)

  Per-slot Browse + Activate pattern (JanAI/LM Studio):
  - Each card has its own Browse/Search/Install/Activate buttons
  - LoadStageOverlay mounts when ANY slot is loading
  - Master "Save & Continue" at the bottom commits drafts + advances view
    (does NOT load anything — cards handle their own loads)

  DTCG tokens throughout. Fluid clamp() sizing. Role color accents from
  `wizard.role.*` tokens.
-->
<script lang="ts">
import { Brain, Headphones, Network, Search, Sparkles } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { logInfo } from "$lib/sys/logger.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import type { ModelInfo, SlotId, SlotInfo } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import BrainCard from "../../components/BrainCard.svelte";
import MemoryCard from "../../components/MemoryCard.svelte";
import VisionCard from "../../components/VisionCard.svelte";
import VoiceCard from "../../components/VoiceCard.svelte";
import PresetBanner from "../components/PresetBanner.svelte";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import ApiKeyPanel from "../panels/ApiKeyPanel.svelte";
import EscalationConfigPanel from "../panels/EscalationConfigPanel.svelte";
import LatencyTuningPanel from "../panels/LatencyTuningPanel.svelte";
import BrowseLocalPopup from "../popups/BrowseLocalPopup.svelte";
import { SlotCard } from "../popups/index.js";
import SearchHfPopup from "../popups/SearchHfPopup.svelte";

const overlayState = setupWizardOverlayState;

type RoleTab = "brain" | "encoder" | "voice" | "helpers" | "routing";

interface RoleDef {
	id: RoleTab;
	label: string;
	icon: typeof Brain;
	accent: string;
	glow: string;
	description: string;
}

const ROLES: RoleDef[] = [
	{
		id: "brain",
		label: "Brain",
		icon: Brain,
		accent: "var(--wizard-role-brain-main)",
		glow: "var(--wizard-role-brain-glow)",
		description: "Primary reasoning engine — thinks, writes code, answers questions.",
	},
	{
		id: "encoder",
		label: "Encoder",
		icon: Search,
		accent: "var(--wizard-role-encoder-main)",
		glow: "var(--wizard-role-encoder-glow)",
		description: "Search, memory, and vision understanding. Finds and indexes your code.",
	},
	{
		id: "voice",
		label: "Voice",
		icon: Headphones,
		accent: "var(--wizard-role-voice-main)",
		glow: "var(--wizard-role-voice-glow)",
		description: "Speech-to-text, text-to-speech, live voice conversation.",
	},
	{
		id: "helpers",
		label: "Helpers",
		icon: Sparkles,
		accent: "var(--wizard-role-minion-main)",
		glow: "var(--wizard-role-minion-glow)",
		description: "Background workers for routing, tagging, fast chat, vision summaries.",
	},
	{
		id: "routing",
		label: "Routing",
		icon: Network,
		accent: "var(--accent-teal-main)",
		glow: "var(--accent-teal-glow)",
		description:
			"Cloud providers, escalation chain, and latency tuning. The plumbing between the brains you picked above.",
	},
];

// Secondary slot IDs per tab — primary slot has its own rich card.
// Capabilities must match the kernel slot registration for filtering.
const ENCODER_SECONDARIES: Array<{ slotId: SlotId; capability: string }> = [
	{ slotId: "rag.reranker", capability: "Reranking" },
	{ slotId: "rag.encoder", capability: "Embedding" },
	{ slotId: "vision.embedder", capability: "VisionEmbedding" },
];
const VOICE_SECONDARIES: Array<{ slotId: SlotId; capability: string; optional?: boolean }> = [
	{ slotId: "voice.stt", capability: "SpeechToText" },
	{ slotId: "voice.brain", capability: "TextGeneration", optional: true },
	{ slotId: "voice.wake", capability: "SpeechToText", optional: true },
];
const HELPER_SLOTS: Array<{ slotId: SlotId; capability: string }> = [
	{ slotId: "minion.shared", capability: "TextGeneration" },
	{ slotId: "minion.escalation", capability: "TextGeneration" },
	{ slotId: "chat.fast", capability: "TextGeneration" },
	{ slotId: "chat.vision", capability: "VisionLanguage" },
];

// ── Tab state ─────────────────────────────────────────────
let activeTab = $state<RoleTab>("brain");

function selectTab(tab: RoleTab): void {
	logInfo("wizard.config", `tab: ${activeTab} → ${tab}`);
	activeTab = tab;
}

// ── Per-slot popup state ──────────────────────────────────
let browseSlot = $state<{ slotId: SlotId; capability: string } | null>(null);
let searchSlot = $state<{ slotId: SlotId; capability: string } | null>(null);
let showTabsInfo = $state(false);

function openBrowse(slotId: SlotId, capability: string): void {
	logInfo("wizard.config", `Browse clicked — slot=${slotId}`);
	browseSlot = { slotId, capability };
}
function openSearch(slotId: SlotId, capability: string): void {
	logInfo("wizard.config", `Search HF clicked — slot=${slotId}`);
	searchSlot = { slotId, capability };
}
function closeBrowse(): void {
	browseSlot = null;
}
function closeSearch(): void {
	searchSlot = null;
}

function lookupSlot(slotId: SlotId): { slot: SlotInfo | undefined; model: ModelInfo | null } {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	const model = slot?.assigned_model_id
		? (modelsState.models.find((m) => m.id === slot.assigned_model_id) ?? null)
		: null;
	return { slot, model };
}

// ── Save action ───────────────────────────────────────────
async function handleSaveAndContinue(): Promise<void> {
	logInfo("wizard.config", "Save & Continue clicked (config → validate)");
	await overlayState.applyAndAdvance();
}

// ── Hardware summary line ─────────────────────────────────
const gpuName = $derived(hardwareState.gpuName ?? "No GPU");
const vramMb = $derived(hardwareState.vramTotalMb);
const tier = $derived(hardwareState.tier);
const assignedCount = $derived(modelsState.slots.filter((s) => !!s.assigned_model_id).length);
const totalSlots = $derived(modelsState.slots.length);
</script>

<div class="config-view">
	<!-- Recommendation chassis — reads wizardState.recommendations + selectedPresetName/tier -->
	<PresetBanner />

	<!-- Hardware summary + VRAM bar -->
	<div class="cv-hw-bar">
		<Text size="xs" color="muted">
			{gpuName} ({formatMb(vramMb)} VRAM) · {tier} · {assignedCount} of {totalSlots} slots assigned
		</Text>
	</div>

	<VramBar />

	<!-- Tab bar -->
	<div class="cv-tabs" role="tablist" aria-label="Model role groups">
		{#each ROLES as role (role.id)}
			<button
				type="button"
				class="cv-tab"
				class:cv-tab-active={activeTab === role.id}
				role="tab"
				aria-selected={activeTab === role.id}
				aria-controls="cv-panel-{role.id}"
				onclick={() => selectTab(role.id)}
				style:--tab-accent={role.accent}
				style:--tab-glow={role.glow}
			>
				<role.icon size={14} />
				<span class="cv-tab-label">{role.label}</span>
			</button>
		{/each}
		<div class="cv-tabs-help">
			<WizardHelpTip
				tip="Each tab groups related slots. Per-slot Browse + Activate — you control what loads, when. 'Save & Continue' just commits drafts; cards handle loads."
				label="How do tabs work?"
			/>
			<Button preset="button-ghost" size="sm" onclick={() => (showTabsInfo = true)}>
				All slots
			</Button>
		</div>
	</div>

	<!-- Role description -->
	{#each ROLES as role (role.id)}
		{#if activeTab === role.id}
			<div class="cv-role-desc" style:--tab-accent={role.accent}>
				<role.icon size={16} />
				<Text size="sm" color="secondary">{role.description}</Text>
			</div>
		{/if}
	{/each}

	<!-- Tab panel -->
	<div class="cv-panel" id="cv-panel-{activeTab}" role="tabpanel">
		{#if activeTab === "brain"}
			<!-- Brain: rich BrainCard covers chat.brain (size selector + per-slot Apply) -->
			<div class="cv-single-card">
				<BrainCard />
			</div>
		{:else if activeTab === "encoder"}
			<!-- Encoder: MemoryCard (primary) + SlotCard secondaries + VisionCard for vision.encoder -->
			<div class="cv-stack">
				<MemoryCard />
				<VisionCard />
				<div class="cv-sub-label">
					<Text size="xs" weight="bold" color="muted">Additional encoder slots</Text>
					<WizardHelpTip
						tip="Secondary encoder slots. Reranker reorders retrieval results, code encoder specializes in source analysis, vision embedder handles image similarity."
						label="What are these for?"
					/>
				</div>
				<div class="cv-grid">
					{#each ENCODER_SECONDARIES as entry (entry.slotId)}
						{@const info = lookupSlot(entry.slotId)}
						{#if info.slot}
							<SlotCard
								slot={info.slot}
								model={info.model}
								optional
								onBrowseLocal={() => openBrowse(entry.slotId, entry.capability)}
								onSearchHF={() => openSearch(entry.slotId, entry.capability)}
							/>
						{:else}
							<div class="cv-slot-missing">
								<Text size="xs" color="muted">Slot not registered: {entry.slotId}</Text>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{:else if activeTab === "voice"}
			<!-- Voice: VoiceCard (primary STT+TTS) + secondaries (brain, wake) -->
			<div class="cv-stack">
				<VoiceCard />
				<div class="cv-sub-label">
					<Text size="xs" weight="bold" color="muted">Optional voice slots</Text>
					<WizardHelpTip
						tip="Voice Brain is for full-duplex speech-to-speech (Moshi/Clyffy 7B). Wake word runs always-on detection for 'Hey Clyffy'. Both are GPU-heavy — set up after STT/TTS work."
						label="When do I need these?"
					/>
				</div>
				<div class="cv-grid">
					{#each VOICE_SECONDARIES as entry (entry.slotId)}
						{@const info = lookupSlot(entry.slotId)}
						{#if info.slot}
							<SlotCard
								slot={info.slot}
								model={info.model}
								optional={entry.optional ?? false}
								onBrowseLocal={() => openBrowse(entry.slotId, entry.capability)}
								onSearchHF={() => openSearch(entry.slotId, entry.capability)}
							/>
						{:else}
							<div class="cv-slot-missing">
								<Text size="xs" color="muted">Slot not registered: {entry.slotId}</Text>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{:else if activeTab === "helpers"}
			<!-- Helpers: all optional SlotCard entries -->
			<div class="cv-stack">
				<div class="cv-sub-label">
					<Text size="xs" weight="bold" color="muted">Background workers (all optional)</Text>
					<WizardHelpTip
						tip="Minions run lightweight background tasks (routing, tagging). Chat.fast is a small fast chat alternative. Chat.vision answers image questions when the main brain is text-only."
						label="What do helpers do?"
					/>
				</div>
				<div class="cv-grid">
					{#each HELPER_SLOTS as entry (entry.slotId)}
						{@const info = lookupSlot(entry.slotId)}
						{#if info.slot}
							<SlotCard
								slot={info.slot}
								model={info.model}
								optional
								onBrowseLocal={() => openBrowse(entry.slotId, entry.capability)}
								onSearchHF={() => openSearch(entry.slotId, entry.capability)}
							/>
						{:else}
							<div class="cv-slot-missing">
								<Text size="xs" color="muted">Slot not registered: {entry.slotId}</Text>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{:else}
			<!-- Routing: API keys + escalation chain + latency tuning, stacked vertically -->
			<div class="cv-stack cv-routing-stack">
				<div class="cv-sub-label">
					<Text size="xs" weight="bold" color="muted">Cloud providers</Text>
					<WizardHelpTip
						tip="Optional. Local-only stays fully on your machine. Adding API keys lets the escalation chain reach a cloud provider when local can't answer."
						label="Do I need cloud providers?"
					/>
				</div>
				<ApiKeyPanel />

				<div class="cv-sub-label">
					<Text size="xs" weight="bold" color="muted">Escalation chain</Text>
					<WizardHelpTip
						tip="The order Clyffy tries when answering. Voice Brain (CPU) handles fast turns, Main AI (GPU) takes complex questions, Cloud API kicks in when both can't keep up."
						label="What's an escalation chain?"
					/>
				</div>
				<EscalationConfigPanel />

				<div class="cv-sub-label">
					<Text size="xs" weight="bold" color="muted">Latency tuning</Text>
					<WizardHelpTip
						tip="Controls how fast Clyffy responds versus how thorough she is. Defaults work for most setups; tune buffer / silence / chunk size only if you notice lag."
						label="Should I change these?"
					/>
				</div>
				<LatencyTuningPanel />
			</div>
		{/if}
	</div>

	<!-- Footer: Save & Continue -->
	<div class="cv-footer">
		<Button preset="button-primary" size="lg" onclick={handleSaveAndContinue} disabled={overlayState.applying}>
			{#if overlayState.applying}
				<Spinner size="xs" />
				Saving…
			{:else}
				Save & Continue
			{/if}
		</Button>
	</div>

	{#if overlayState.error}
		<div class="cv-error">
			<Text size="sm">{overlayState.error}</Text>
		</div>
	{/if}
</div>

<!-- Per-slot Browse / Search popups (mount when an entry is set) -->
{#if browseSlot}
	<BrowseLocalPopup
		slotId={browseSlot.slotId}
		capability={browseSlot.capability}
		open={true}
		onSelect={() => {
			closeBrowse();
		}}
		onClose={closeBrowse}
	/>
{/if}

{#if searchSlot}
	<SearchHfPopup
		slotId={searchSlot.slotId}
		capability={searchSlot.capability}
		open={true}
		onDownloadStarted={() => {}}
		onClose={closeSearch}
	/>
{/if}

<WizardInfoPopup
	open={showTabsInfo}
	title="All 13 slots"
	summary="DevPulse exposes every kernel slot so you can pick what runs. Sensible defaults per tier, but nothing is forced."
	points={[
		"Brain (1 slot): chat.brain — primary reasoning LLM.",
		"Encoder (4 slots): rag.embedder, rag.reranker, rag.encoder, vision.embedder — retrieval + vision understanding.",
		"Voice (4 slots): voice.stt, voice.tts, voice.brain, voice.wake — speech pipeline.",
		"Helpers (4 slots): minion.shared, minion.escalation, chat.fast, chat.vision — background workers.",
		"Per-slot Browse loads local files; Search HF pulls from HuggingFace.",
		"Activation is explicit per-slot (LoadStage overlay shows progress).",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showTabsInfo = false)}
/>

<style>
	.config-view {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 2vw, 1.25rem);
		width: 100%;
		max-width: clamp(36rem, 80vw, 72rem);
		margin: 0 auto;
		padding: clamp(0.5rem, 1.5vw, 1rem);
	}

	.cv-hw-bar {
		width: 100%;
		padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 2vw, 1.25rem);
		border-radius: 0.75rem;
		background: var(--glass-deep);
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 15%, var(--border-soft));
		text-align: center;
	}

	/* ── Tab bar ───────────────────────────────── */

	.cv-tabs {
		display: flex;
		align-items: center;
		gap: clamp(0.25rem, 0.75vw, 0.5rem);
		padding: 0.25rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--surface-inset) 85%, transparent);
		border: 1px solid var(--border-subtle);
		flex-wrap: wrap;
	}

	.cv-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: clamp(0.375rem, 1vw, 0.5rem) clamp(0.625rem, 1.5vw, 0.875rem);
		border-radius: 0.5rem;
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		transition: color 180ms ease-out, background 180ms ease-out, border-color 180ms ease-out, box-shadow 180ms ease-out;
	}
	.cv-tab:hover {
		color: var(--text-secondary);
		border-color: color-mix(in oklch, var(--tab-accent) 40%, var(--border-subtle));
	}
	.cv-tab-active {
		color: var(--tab-accent);
		background: color-mix(in oklch, var(--tab-accent) 15%, transparent);
		border-color: color-mix(in oklch, var(--tab-accent) 45%, transparent);
		box-shadow: 0 0 0.625rem color-mix(in oklch, var(--tab-glow) 55%, transparent);
	}

	.cv-tab-label {
		font-size: inherit;
	}

	.cv-tabs-help {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: auto;
		padding: 0 0.375rem;
	}

	/* ── Role description ─────────────────────── */

	.cv-role-desc {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem);
		border-radius: 0.625rem;
		background: color-mix(in oklch, var(--tab-accent) 8%, transparent);
		border: 1px solid color-mix(in oklch, var(--tab-accent) 20%, var(--border-soft));
		border-left: 3px solid var(--tab-accent);
		color: var(--tab-accent);
	}

	/* ── Panel content ────────────────────────── */

	.cv-panel {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.5vw, 1.25rem);
	}

	.cv-single-card {
		display: flex;
		flex-direction: column;
	}

	.cv-stack {
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.5vw, 1rem);
	}

	.cv-sub-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding-top: 0.5rem;
	}

	.cv-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(clamp(16rem, 30vw, 20rem), 1fr));
		gap: clamp(0.5rem, 1vw, 0.75rem);
	}

	.cv-slot-missing {
		padding: 0.75rem 1rem;
		border-radius: 0.625rem;
		border: 1px dashed var(--border-subtle);
		background: color-mix(in oklch, var(--surface-inset) 80%, transparent);
		text-align: center;
	}

	/* ── Cards in panel: role-tinted border ─── */

	.cv-single-card > :global(*),
	.cv-stack > :global(*) {
		border-radius: 0.75rem;
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 20%, var(--border-soft));
		box-shadow:
			0 0.25rem 1rem color-mix(in oklch, var(--accent-teal-main) 6%, transparent),
			0 0.0625rem 0.1875rem oklch(0 0 0 / 0.15);
		transition: border-color 200ms ease-out, box-shadow 200ms ease-out;
	}
	.cv-single-card > :global(*:hover),
	.cv-stack > :global(*:hover) {
		border-color: color-mix(in oklch, var(--accent-teal-main) 35%, var(--border-soft));
	}

	/* Routing tab — stacked panels already have their own surface chrome,
	   so suppress the role-tinted card frame on direct children to avoid
	   double-bordered nesting. The inner panels (ApiKey / Escalation /
	   Latency) supply their own DTCG surfaces. */
	.cv-routing-stack > :global(*) {
		border: none;
		box-shadow: none;
		border-radius: 0;
	}
	.cv-routing-stack > :global(*:hover) {
		border-color: transparent;
	}

	/* ── Footer ───────────────────────────────── */

	.cv-footer {
		display: flex;
		justify-content: center;
		padding-top: clamp(0.5rem, 1.5vh, 1rem);
	}

	.cv-error {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--signal-error) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);
		color: var(--signal-error);
	}
</style>

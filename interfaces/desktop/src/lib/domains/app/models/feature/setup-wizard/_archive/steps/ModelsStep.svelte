<!--
  @file ModelsStep.svelte
  Canonical second screen for setup.
  Preset-aware brain chooser, layman role cards, one-click setup, and visible progress.
-->
<script lang="ts">
import {
	ArrowLeft,
	ArrowRight,
	Brain,
	Check,
	Download,
	Eye,
	Mic,
	Search,
	Settings2,
	Sparkles,
	Volume2,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { AutoConfig, HardwareTier } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import DownloadProgressRow from "../components/DownloadProgressRow.svelte";
import SlotSwapPopup from "../components/SlotSwapPopup.svelte";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import {
	bulkDownloadAndAssign,
	cancelActiveDownload,
	downloadAndAssign,
} from "../wizard.service.js";
import { wizardState } from "../wizard.state.svelte.js";
import {
	type DownloadsCopy,
	type DownloadTracker,
	friendlyName,
	getSlotLabel,
	type ModelsCopy,
	type SlotRole,
} from "../wizard.types.js";

interface Props {
	copy: ModelsCopy;
	downloadsCopy: DownloadsCopy;
	allPresets: AutoConfig[];
	loadingRecommendations?: boolean;
	recommendationsError?: string | null;
	switchingTier: HardwareTier | null;
	onSelectTier: (tier: HardwareTier) => void;
	onRetryRecommendations: () => void;
	onContinue: () => void;
	onBack: () => void;
	onCustomize: () => void;
	onBrowse: () => void;
}

let {
	copy,
	downloadsCopy,
	allPresets,
	loadingRecommendations = false,
	recommendationsError = null,
	switchingTier,
	onSelectTier,
	onRetryRecommendations,
	onContinue,
	onBack,
	onCustomize,
	onBrowse,
}: Props = $props();

let setupInProgress = $state(false);
let setupComplete = $state(false);
let setupError = $state<string | null>(null);
let showPageHelp = $state(false);
let manageSlotId = $state<string | null>(null);
let manageInitialTab = $state<"recommended" | "local" | "search">("recommended");

const recs = $derived(wizardState.recommendations);
const hasRecs = $derived(recs.length > 0);
const activeTier = $derived(wizardState.selectedTier);
const activePresetName = $derived(wizardState.selectedPresetName);
const canContinue = $derived(
	setupComplete || modelsState.userSlots.some((slot) => !!slot.assigned_model_id),
);

const visibleSetupDownloads = $derived(
	wizardState.downloadList.filter((tracker) => tracker.slotId !== "system.pending"),
);

const SLOT_ORDER = [
	"chat.brain",
	"chat.fast",
	"chat.vision",
	"minion.shared",
	"minion.escalation",
	"rag.embedder",
	"rag.encoder",
	"rag.reranker",
	"vision.embedder",
	"voice.stt",
	"voice.tts",
	"voice.brain",
	"voice.wake",
];

type ModelsSlotCard = {
	slotId: string;
	role: SlotRole;
	icon: typeof Brain;
	title: string;
	description: string;
	recommended: (typeof recs)[number] | null;
	assignedName: string | null;
	techLabel: string;
	state: "ready" | "loading" | "failed" | "assigned" | "empty";
	stateLabel: string;
};

const brainOptions = $derived.by(() => {
	const seen = new Set<string>();
	return allPresets
		.map((preset) => {
			const brain = preset.recommendations.find((rec) => rec.slot_id === "chat.brain");
			if (!brain || seen.has(brain.model_filename)) return null;
			seen.add(brain.model_filename);
			return {
				tier: preset.tier,
				presetName: preset.preset_name,
				filename: brain.model_filename,
				displayName: prettifyBrainName(brain.model_filename),
				sizeMb: brain.model_size_mb,
				vramMb: brain.vram_estimate_mb,
				alreadyDownloaded: brain.already_downloaded,
			};
		})
		.filter((value): value is NonNullable<typeof value> => value !== null)
		.sort((left, right) => right.sizeMb - left.sizeMb);
});

function prettifyBrainName(filename: string): string {
	return filename
		.replace(/\.gguf$|\.safetensors$|\.onnx$/i, "")
		.replace(/-Instruct|-Chat/i, "")
		.replace(/-Q\d_K_M|-Q\d_K_S|-Q\d_0/i, "")
		.replace(/_/g, " ");
}

function roleIcon(slotId: string): typeof Brain {
	const label = getSlotLabel(slotId);
	if (!label) return Brain;
	if (label.role === "reasoning") return Brain;
	if (label.role === "observation") return Sparkles;
	if (label.role === "encoder")
		return slotId === "vision.embedder" || slotId === "chat.vision" ? Eye : Search;
	if (label.role === "voice")
		return slotId === "voice.stt" || slotId === "voice.wake" ? Mic : Volume2;
	return Brain;
}

function roleTooltip(slotId: string): string {
	if (slotId === "chat.brain") {
		return "The main AI that thinks, writes code, and answers questions. Bigger usually means smarter, but it uses more memory.";
	}
	if (slotId === "chat.fast") {
		return "The fast routing brain handles quick turns, short assistant hops, and low-latency work so the bigger brain stays free for heavier tasks.";
	}
	if (slotId === "chat.vision") {
		return "The vision reasoning slot answers questions about screenshots and images instead of only embedding them for search.";
	}
	if (slotId === "minion.shared") {
		return "A smaller helper AI that handles background tasks so the main brain stays responsive.";
	}
	if (slotId === "minion.escalation") {
		return "A heavier fallback brain that only needs to load when a task is hard enough to justify it.";
	}
	if (slotId === "rag.embedder") {
		return "Turns your code and docs into searchable memory so the assistant can find the right files.";
	}
	if (slotId === "rag.encoder") {
		return "This extra retrieval encoder helps package queries cleanly before vector search runs, which improves memory recall during dev testing.";
	}
	if (slotId === "rag.reranker") {
		return "Re-scores search results so the best match rises to the top instead of relying on raw keyword order.";
	}
	if (slotId === "vision.embedder") {
		return "Lets the assistant understand screenshots and image drops.";
	}
	if (slotId === "voice.stt") {
		return "Speech-to-text. Converts what you say into text the assistant can read.";
	}
	if (slotId === "voice.tts") {
		return "Text-to-speech. Speaks the assistant's replies out loud.";
	}
	if (slotId === "voice.brain") {
		return "Optional dedicated voice brain. If you skip it, spoken conversations fall back to the main brain.";
	}
	if (slotId === "voice.wake") {
		return "Keeps hands-free wake-word activation available without forcing the whole voice stack to stay hot all the time.";
	}
	return "";
}

function roleAccentForSlot(slotId: string): "brain" | "minion" | "encoder" | "voice" | undefined {
	if (slotId === "chat.brain") return "brain";
	if (slotId === "chat.fast") return "brain";
	if (slotId.startsWith("minion.")) return "minion";
	if (slotId === "chat.vision") return "encoder";
	if (slotId.startsWith("rag.") || slotId.startsWith("vision.")) return "encoder";
	if (slotId.startsWith("voice.")) return "voice";
	return undefined;
}

function slotState(slotId: string): "ready" | "loading" | "failed" | "assigned" | "empty" {
	const status = modelsState.statuses[slotId];
	if (status?.type === "hot" || status?.type === "standby" || status?.type === "warm")
		return "ready";
	if (status?.type === "loading") return "loading";
	if (status?.type === "failed") return "failed";
	if (modelsState.assignedModel(slotId)) return "assigned";
	return "empty";
}

function slotStateLabel(slotId: string): string {
	const state = slotState(slotId);
	if (state === "ready") return "Ready";
	if (state === "loading") return "Loading";
	if (state === "failed") return "Attention";
	if (state === "assigned") return "Assigned";
	return "Empty";
}

const slotCards = $derived.by((): ModelsSlotCard[] => {
	const recommendationMap = new Map<string, (typeof recs)[number]>(
		recs.map((rec) => [rec.slot, rec]),
	);
	return [...modelsState.userSlots]
		.filter((slot) => Boolean(getSlotLabel(slot.id)))
		.sort((left, right) => {
			const leftIndex = SLOT_ORDER.indexOf(left.id);
			const rightIndex = SLOT_ORDER.indexOf(right.id);
			return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
		})
		.map((slot) => {
			const assigned = modelsState.assignedModel(slot.id);
			const recommended = recommendationMap.get(slot.id) ?? null;
			const label = getSlotLabel(slot.id);
			const role = label?.role ?? "encoder";
			return {
				slotId: slot.id,
				role,
				icon: roleIcon(slot.id),
				title: friendlyName(slot.id),
				description: label?.description ?? slot.id,
				recommended,
				assignedName: assigned ? prettifyBrainName(assigned.filename) : null,
				techLabel: assigned
					? `${assigned.filename} · ${formatMb(assigned.size_mb)}`
					: recommended
						? `${recommended.name} · ${formatMb(recommended.sizeMb)}`
						: "No preset pick yet",
				state: slotState(slot.id),
				stateLabel: slotStateLabel(slot.id),
			};
		});
});

const slotGroups = $derived.by(
	(): Array<{ id: SlotRole; title: string; subtitle: string; cards: ModelsSlotCard[] }> => {
		const groups: Array<{
			id: SlotRole;
			title: string;
			subtitle: string;
			cards: ModelsSlotCard[];
		}> = [
			{
				id: "reasoning",
				title: "Thinking & Routing",
				subtitle: "Main brains, fast-path routing, and heavy fallback reasoning roles.",
				cards: slotCards.filter((card) => card.role === "reasoning"),
			},
			{
				id: "observation",
				title: "Helpers",
				subtitle: "Support roles that keep the main coding flow responsive during dev work.",
				cards: slotCards.filter((card) => card.role === "observation"),
			},
			{
				id: "encoder",
				title: "Search & Vision",
				subtitle: "Retrieval, reranking, screenshot understanding, and image-aware reasoning.",
				cards: slotCards.filter((card) => card.role === "encoder"),
			},
			{
				id: "voice",
				title: "Voice & Wake",
				subtitle: "Listening, speaking, live conversation, and wake-word roles.",
				cards: slotCards.filter((card) => card.role === "voice"),
			},
		];
		return groups.filter((group) => group.cards.length > 0);
	},
);

async function handleSetup(): Promise<void> {
	setupInProgress = true;
	setupError = null;
	const { toast } = await import("svelte-sonner");

	try {
		const toDownload = recs.filter((rec) => !rec.alreadyDownloaded);
		if (toDownload.length > 0) {
			toast.info(`${copy.setup_in_progress_label} (${toDownload.length})`);
			await bulkDownloadAndAssign(toDownload);
		}

		const alreadyLocal = recs.filter((rec) => rec.alreadyDownloaded);
		for (const rec of alreadyLocal) {
			const model = modelsState.models.find((entry) => entry.filename === rec.file);
			if (!model) continue;
			try {
				await modelsState.assign(rec.slot, model.id);
			} catch {
				// Non-fatal: existing assignment is acceptable during setup.
			}
		}

		await modelsState.scan();
		await modelsState.refresh();
		setupComplete = true;
		toast.success(copy.setup_complete_message);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		setupError = message;
		toast.error(`Setup failed: ${message}`);
	} finally {
		setupInProgress = false;
	}
}

async function handleRetry(): Promise<void> {
	setupError = null;
	await handleSetup();
}

async function handleCancelSetupDownload(downloadId: string): Promise<void> {
	try {
		await cancelActiveDownload(downloadId);
	} catch (error) {
		setupError = error instanceof Error ? error.message : String(error);
	}
}

async function handleRetryDownload(tracker: DownloadTracker): Promise<void> {
	const rec = recs.find((recommendation) => recommendation.slot === tracker.slotId);
	if (!rec) {
		setupError = `Retry unavailable for ${tracker.friendlyName} because the slot recommendation is missing.`;
		return;
	}

	setupInProgress = true;
	setupError = null;
	wizardState.dismissDownload(tracker.downloadId);

	try {
		await downloadAndAssign(rec);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (error) {
		setupError = error instanceof Error ? error.message : String(error);
	} finally {
		setupInProgress = false;
	}
}

function handleDismissDownload(downloadId: string): void {
	wizardState.dismissDownload(downloadId);
}

function openSlotManager(slotId: string, tab: "recommended" | "local" | "search"): void {
	manageSlotId = slotId;
	manageInitialTab = tab;
}

async function handleSlotSwapSelect(modelId: string): Promise<void> {
	if (!manageSlotId) return;
	const { toast } = await import("svelte-sonner");
	try {
		await modelsState.assign(manageSlotId, modelId);
		toast.success(`${friendlyName(manageSlotId)} updated`);
	} catch (error) {
		toast.error(error instanceof Error ? error.message : String(error));
		throw error;
	}
}

async function handleRecommendedSlotAction(slotId: string): Promise<void> {
	const rec = recs.find((entry) => entry.slot === slotId);
	if (!rec) {
		openSlotManager(slotId, "search");
		return;
	}

	const { toast } = await import("svelte-sonner");
	setupError = null;
	try {
		if (rec.alreadyDownloaded) {
			await modelsState.scan();
			await modelsState.refresh();
			const model = modelsState.models.find((entry) => entry.filename === rec.file);
			if (!model) {
				throw new Error("Recommended file is marked on disk but was not found in the registry.");
			}
			await modelsState.assign(slotId, model.id);
			toast.success(`${friendlyName(slotId)} now uses the recommended model`);
		} else {
			await downloadAndAssign(rec);
		}
	} catch (error) {
		setupError = error instanceof Error ? error.message : String(error);
		toast.error(setupError);
	}
}
</script>

<div class="models-step">
	<header class="step-header">
		<Text size="xl" weight="bold">{copy.title}</Text>
		<Text size="sm" class="step-subtitle">
			{#if hasRecs}
				{copy.subtitle_with_recs}
			{:else}
				{copy.subtitle_no_recs}
			{/if}
		</Text>
		<Text size="sm" class="step-guidance">
			This page keeps the choices readable: one brain decision, then every kernel role surfaced slot by slot.
		</Text>
		<div class="step-help-row">
			<WizardHelpTip tip="Use the main setup button for the full recommended local-first stack. Customize and Browse stay available if you want to override anything." />
			<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
				Model setup in plain English
			</Button>
		</div>
	</header>

	{#if loadingRecommendations && !hasRecs}
		<div class="loading-state">
			<img src="/imgs/mascot/clyffyloading.gif" alt="Clyffy analyzing hardware" class="loading-mascot" />
			<Text size="base" weight="semibold">Analyzing your {hardwareState.gpuName ?? "hardware"}...</Text>
			<Text size="sm" class="loading-copy">Finding the cleanest local model plan.</Text>
		</div>
	{:else if recommendationsError && !hasRecs}
		<div class="error-banner">
			<Text size="sm" weight="semibold">Couldn't auto-detect your model plan</Text>
			<Text size="sm" class="error-copy">{recommendationsError}</Text>
			<div class="error-actions">
				<Button preset="neuro-glow" size="sm" onclick={onRetryRecommendations}>{copy.error_retry_label}</Button>
				<Button preset="secondary" size="sm" onclick={onBrowse}>{copy.browse_link_label}</Button>
			</div>
		</div>
	{:else if hasRecs}
		<Card preset="neuro-elevated" label="Brain options" class="w-full p-4">
			<div class="flex flex-col gap-1 w-full">
				<div class="flex items-center gap-1.5">
					<Text size="xs" weight="bold" class="uppercase tracking-wide text-[var(--text-muted)]">Brain Options</Text>
					<WizardHelpTip tip="This is the main coding brain. Larger options generally reason better, but they need more VRAM and take longer to download." />
				</div>
				<Text size="sm" color="secondary">
					Pick the main model first. Everything else below is grouped by what it does for you.
				</Text>
			</div>

			<div class="brain-chips">
				{#each brainOptions as brain (brain.filename)}
					{@const isActive = brain.tier === activeTier}
					{@const isSwitching = switchingTier === brain.tier}
					<Card
						as="button"
						preset={isActive ? "neuro-elevated" : "neuro-minimal"}
						disabled={setupInProgress || isSwitching}
						class={cn(
							"relative min-w-[10.5rem] p-3 gap-1.5 text-left cursor-pointer transition-transform",
							isSwitching && "opacity-65 cursor-not-allowed",
							isActive && "ring-1 ring-[var(--accent-purple-main)]",
						)}
						onclick={() => onSelectTier(brain.tier)}
					>
						<div class="flex items-center gap-1.5">
							<Brain size={14} />
							<span class="flex-1 min-w-0 truncate text-sm font-bold">{brain.displayName}</span>
							{#if brain.alreadyDownloaded}
								<Check size={12} class="text-[var(--accent-green-main)]" />
							{/if}
						</div>
						<div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)] tabular-nums">
							<span>{formatMb(brain.sizeMb)}</span>
							<span>·</span>
							<span>~{formatMb(brain.vramMb)} VRAM</span>
						</div>
						{#if isSwitching}
							<div class="absolute top-2 right-2"><Spinner size="sm" /></div>
						{/if}
					</Card>
				{/each}
			</div>

			{#if activePresetName}
				<Text size="xs" color="muted" class="w-full text-right">Active preset: {activePresetName}</Text>
			{/if}
		</Card>

		<section class="slot-plan-shell">
			<div class="section-head">
				<div class="section-title-row">
					<Text size="xs" weight="bold" class="section-kicker">Dev Baseline</Text>
					<WizardHelpTip tip="Every kernel slot is visible during dev. You can browse local models, download the recommendation, or search HuggingFace role by role." />
				</div>
				<Text size="sm" class="section-copy">Every slot is surfaced during dev, even when the active preset only needs part of the stack right now.</Text>
			</div>

			<Card preset="glass-deep" class="grid grid-cols-[auto_1fr] gap-3.5 p-4">
				<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="" aria-hidden="true" class="w-[4.25rem] h-[4.25rem] object-contain" />
				<div class="flex flex-col gap-1">
					<Text size="xs" weight="bold" class="uppercase tracking-wider text-[var(--accent-cyan-main)]">Clyffy Guidance</Text>
					<Text size="sm" color="secondary">Use the recommended button for the fastest baseline, then open any slot to browse local files, import a model, or search HuggingFace without leaving setup.</Text>
				</div>
			</Card>

			{#each slotGroups as group (group.id)}
				<section class="slot-group-shell" data-role={group.id}>
					<div class="slot-group-head">
						<Text size="xs" weight="bold" class="section-kicker">{group.title}</Text>
						<Text size="sm" class="section-copy">{group.subtitle}</Text>
					</div>
					<div class="slot-card-grid">
						{#each group.cards as slot (slot.slotId)}
							{@const Icon = slot.icon}
							<Card preset="neuro-solid" class="p-4 gap-3 border-l-4 border-l-[var(--accent-teal-main)]" data-role={slot.role} data-state={slot.state}>
								<div class="flex items-start justify-between gap-3">
									<div class="flex flex-col gap-0.5 min-w-0 flex-1">
										<div class="flex items-center gap-1.5">
											<Icon size={18} class="text-[var(--accent-teal-main)] shrink-0" />
											<span class="text-[0.9375rem] font-bold">{slot.title}</span>
											<WizardHelpTip tip={roleTooltip(slot.slotId)} label={slot.title} />
										</div>
										<Text size="xs" color="muted">{slot.description}</Text>
									</div>
									<Badge
										variant={slot.state === "ready" ? "positive" : slot.state === "failed" ? "negative" : slot.state === "loading" ? "informative" : "neutral"}
										size="sm"
									>
										{slot.stateLabel}
									</Badge>
								</div>
								<div class="flex flex-col gap-0.5">
									<Text size="sm" weight="semibold">{slot.assignedName ?? "No model assigned yet"}</Text>
									<Text size="xs" color="muted">{slot.techLabel}</Text>
								</div>
								<div class="flex items-center gap-1.5 flex-wrap">
									{#if slot.recommended}
										<Badge variant="informative" size="sm">
											{slot.recommended.alreadyDownloaded ? "On disk" : `Recommended · ${formatMb(slot.recommended.sizeMb)}`}
										</Badge>
									{:else}
										<Badge variant="neutral" size="sm">Manual pick</Badge>
									{/if}
								</div>
								<div class="flex items-center gap-2 flex-wrap">
									<Button preset="secondary" size="sm" onclick={() => void handleRecommendedSlotAction(slot.slotId)}>
										{#if slot.recommended?.alreadyDownloaded}
											<Check size={14} /> Use recommended
										{:else if slot.recommended}
											<Download size={14} /> Download recommended
										{:else}
											<Sparkles size={14} /> Find best fit
										{/if}
									</Button>
									<Button preset="ghost" size="sm" onclick={() => openSlotManager(slot.slotId, "local")}>Browse</Button>
									<Button preset="ghost" size="sm" onclick={() => openSlotManager(slot.slotId, "search")}>Search HF</Button>
								</div>
							</Card>
						{/each}
					</div>
				</section>
			{/each}
		</section>

		{#if visibleSetupDownloads.length > 0 || setupInProgress}
			<Card preset="neuro-minimal" class="w-full p-4 gap-3">
				<div class="flex flex-col gap-1 w-full">
					<Text size="xs" weight="bold" class="uppercase tracking-wide text-[var(--text-muted)]">Live Setup</Text>
					<Text size="sm" color="secondary">
						{#if visibleSetupDownloads.length > 0}
							Real kernel download state. Bytes, failures, and cancel events land here.
						{:else}
							Applying models that are already on disk.
						{/if}
					</Text>
				</div>
				{#if visibleSetupDownloads.length > 0}
					<div class="flex flex-col gap-3">
						{#each visibleSetupDownloads as tracker (tracker.downloadId)}
							<DownloadProgressRow
								tracker={tracker}
								copy={downloadsCopy}
								roleAccent={roleAccentForSlot(tracker.slotId)}
								onCancel={handleCancelSetupDownload}
								onRetry={handleRetryDownload}
								onDismiss={handleDismissDownload}
							/>
						{/each}
					</div>
				{:else}
					<Card preset="glass-deep" class="flex items-center justify-center gap-2 p-3.5">
						<Spinner size="sm" />
						<Text size="sm" color="secondary">Assigning the recommended models that are already on disk.</Text>
					</Card>
				{/if}
			</Card>
		{/if}

		{#if !setupComplete}
			<Button preset="neuro-glow" size="lg" onclick={handleSetup} disabled={setupInProgress} class="w-full">
				{#if setupInProgress}
					<Spinner size="md" /> {copy.setup_in_progress_label}
				{:else}
					<Download size={18} /> {copy.setup_button_label}
				{/if}
			</Button>
		{:else}
			<Card preset="glass-deep" class="flex items-center justify-center gap-2 w-full p-3.5">
				<Check size={18} class="text-[var(--accent-green-main)]" />
				<Text size="sm" weight="semibold" class="text-[var(--accent-green-main)]">{copy.setup_complete_message}</Text>
			</Card>
		{/if}

		{#if setupError}
			<Card preset="neuro-minimal" class="w-full p-4 gap-2 border-l-4 border-l-[var(--signal-error)]">
				<Text size="sm" weight="semibold">Setup hit a real error</Text>
				<Text size="sm" color="secondary">{setupError}</Text>
				<div class="flex items-center gap-2">
					<Button preset="neuro-glow" size="sm" onclick={handleRetry}>{copy.error_retry_label}</Button>
					<Button preset="secondary" size="sm" onclick={onBrowse}>{copy.browse_link_label}</Button>
					<Button preset="ghost" size="sm" onclick={onCustomize}>{copy.error_pick_manually_label}</Button>
				</div>
			</Card>
		{/if}
	{/if}

	<div class="escape-actions">
		<Button preset="ghost" size="sm" onclick={onCustomize}>
			<Settings2 size={14} /> {copy.customize_link_label}
		</Button>
		<Button preset="ghost" size="sm" onclick={onBrowse}>
			<Search size={14} /> {copy.browse_link_label}
		</Button>
	</div>

	<VramBar />

	<div class="nav">
		<Button preset="ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} /> {copy.back_label}
		</Button>
		<Button preset="neuro-glow" size="md" onclick={onContinue} disabled={!canContinue || setupInProgress}>
			{copy.continue_label} <ArrowRight size={14} />
		</Button>
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Model setup in plain English"
	summary="This page keeps the dev baseline visible slot by slot so you can verify the kernel plan, override it cleanly, and still watch the real queue while setup runs."
	points={[
		"Every slot is visible during dev, even if the active preset only needs some of them immediately.",
		"Use recommended when you want the cleanest kernel-backed baseline for the current hardware tier.",
		"Browse opens the in-wizard slot popup for local assignment, importing, and role-by-role overrides.",
		"Search HuggingFace still feeds the same live kernel queue, registry import path, and slot assignment flow.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showPageHelp = false)}
/>

{#if manageSlotId}
	<SlotSwapPopup
		slotId={manageSlotId}
		initialTab={manageInitialTab}
		onSelect={handleSlotSwapSelect}
		onBrowseAll={onBrowse}
		onClose={() => (manageSlotId = null)}
	/>
{/if}

<style>
	/* Layout only — all visual properties come from ColdLight presets via renderForge.
	   NO hardcoded colors, shadows, borders, or gradients. */

	.models-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: clamp(1rem, 0.75rem + 1vw, 1.5rem);
		width: 100%;
		max-width: 44rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem) 0;
	}

	.step-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		text-align: center;
	}

	.step-help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding-block: 2rem;
	}

	.loading-mascot {
		width: 4.5rem;
		height: 4.5rem;
		object-fit: contain;
	}

	.brain-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		width: 100%;
	}

	.section-head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		width: 100%;
	}

	.section-title-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.slot-plan-shell {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.slot-group-shell {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slot-group-head {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.slot-card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 0.75rem;
	}

	.escape-actions,
	.nav {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.escape-actions {
		justify-content: center;
		flex-wrap: wrap;
	}

	.nav {
		justify-content: space-between;
		padding-top: 0.5rem;
	}

	@media (max-width: 48rem) {
		.slot-card-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

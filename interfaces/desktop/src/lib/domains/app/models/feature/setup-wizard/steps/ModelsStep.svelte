<!--
  @file ModelsStep.svelte
  Canonical second screen for setup.
  Preset-aware brain chooser, layman role cards, one-click setup, and visible progress.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { cn } from "@devpulse/coldlight/utils";
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
import { copyState, fill } from "$lib/sys/copy/index.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { AutoConfig, HardwareTier } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import DownloadProgressRow from "../components/DownloadProgressRow.svelte";
import SlotSwapPopup from "../components/SlotSwapPopup.svelte";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { cancelActiveDownload, downloadAndAssign, setUpRecommended } from "../wizard.service.js";
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

const text = $derived(copyState.catalog?.setup_wizard.models_step ?? null);

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
	return text?.slot_tips[slotId.replace(".", "_")] ?? "";
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
	return text?.state_labels[slotState(slotId)] ?? "";
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
						: (text?.no_preset ?? ""),
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
				title: text?.group_reasoning_title ?? "",
				subtitle: text?.group_reasoning_subtitle ?? "",
				cards: slotCards.filter((card) => card.role === "reasoning"),
			},
			{
				id: "observation",
				title: text?.group_observation_title ?? "",
				subtitle: text?.group_observation_subtitle ?? "",
				cards: slotCards.filter((card) => card.role === "observation"),
			},
			{
				id: "encoder",
				title: text?.group_encoder_title ?? "",
				subtitle: text?.group_encoder_subtitle ?? "",
				cards: slotCards.filter((card) => card.role === "encoder"),
			},
			{
				id: "voice",
				title: text?.group_voice_title ?? "",
				subtitle: text?.group_voice_subtitle ?? "",
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
		}
		await setUpRecommended(recs);

		// Only the real slots say whether this worked: a download that failed
		// leaves its slot empty, and that is what you are told.
		const unassigned = recs.filter((rec) => !modelsState.assignedModel(rec.slot));
		if (unassigned.length > 0) {
			setupError = fill(text?.some_failed ?? "", {
				slots: unassigned.map((rec) => friendlyName(rec.slot)).join(", "),
			});
			return;
		}
		setupComplete = true;
		toast.success(copy.setup_complete_message);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		setupError = message;
		toast.error(fill(text?.setup_failed ?? "", { message }));
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
		setupError = fill(text?.retry_unavailable ?? "", { name: tracker.friendlyName });
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
		toast.success(fill(text?.slot_updated ?? "", { slot: friendlyName(manageSlotId) }));
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
				throw new Error(text?.not_in_registry ?? "");
			}
			await modelsState.assign(slotId, model.id);
			toast.success(fill(text?.now_recommended ?? "", { slot: friendlyName(slotId) }));
		} else {
			await downloadAndAssign(rec);
		}
	} catch (error) {
		setupError = error instanceof Error ? error.message : String(error);
		toast.error(setupError);
	}
}
</script>

{#if text}

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
			{text.guidance}
		</Text>
		<div class="step-help-row">
			<WizardHelpTip tip={text.help_tip} />
			<Button variant="ghost" size="sm" onclick={() => (showPageHelp = true)}>
				{text.help_button}
			</Button>
		</div>
	</header>

	{#if loadingRecommendations && !hasRecs}
		<div class="loading-state">
			<img src="/imgs/mascot/clyffyloading.gif" alt={text.loading_alt} class="loading-mascot" />
			<Text size="base" weight="semibold">{fill(text.loading_title, { gpu: hardwareState.gpuName ?? text.hardware_fallback })}</Text>
			<Text size="sm" class="loading-copy">{text.loading_copy}</Text>
		</div>
	{:else if recommendationsError && !hasRecs}
		<div class="error-banner">
			<Text size="sm" weight="semibold">{text.error_title}</Text>
			<Text size="sm" class="error-copy">{recommendationsError}</Text>
			<div class="error-actions">
				<Button variant="primary" size="sm" onclick={onRetryRecommendations}>{copy.error_retry_label}</Button>
				<Button variant="secondary" size="sm" onclick={onBrowse}>{copy.browse_link_label}</Button>
			</div>
		</div>
	{:else if hasRecs}
		<Card variant="elevated" label={text.brain_options} class="w-full p-4">
			<div class="flex flex-col gap-1 w-full">
				<div class="flex items-center gap-1.5">
					<Text size="xs" weight="bold" color="muted" class="uppercase tracking-wide">{text.brain_options}</Text>
					<WizardHelpTip tip={text.brain_tip} />
				</div>
				<Text size="sm" color="secondary">
					{text.brain_copy}
				</Text>
			</div>

			<div class="brain-chips">
				{#each brainOptions as brain (brain.filename)}
					{@const isActive = brain.tier === activeTier}
					{@const isSwitching = switchingTier === brain.tier}
					<Card
						as="button"
						variant={isActive ? "elevated" : "minimal"}
						data-state={isActive ? "active" : undefined}
						disabled={setupInProgress || isSwitching}
						class={cn(
							"relative min-w-[10.5rem] p-3 gap-1.5 text-left cursor-pointer transition-transform",
							isSwitching && "opacity-65 cursor-not-allowed",
						)}
						onclick={() => onSelectTier(brain.tier)}
					>
						<div class="flex items-center gap-1.5">
							<Brain size={14} />
							<span class="flex-1 min-w-0 truncate text-sm font-bold">{brain.displayName}</span>
							{#if brain.alreadyDownloaded}
								<span class="on-disk-mark"><Check size={12} /></span>
							{/if}
						</div>
						<div class="flex items-center gap-1.5 tabular-nums brain-meta">
							<span>{formatMb(brain.sizeMb)}</span>
							<span>·</span>
							<span>{fill(text.vram_estimate, { size: formatMb(brain.vramMb) })}</span>
						</div>
						{#if isSwitching}
							<div class="absolute top-2 right-2"><Spinner size="sm" /></div>
						{/if}
					</Card>
				{/each}
			</div>

			{#if activePresetName}
				<Text size="xs" color="muted" class="w-full text-right">{fill(text.active_preset, { name: activePresetName })}</Text>
			{/if}
		</Card>

		<section class="slot-plan-shell">
			<div class="section-head">
				<div class="section-title-row">
					<Text size="xs" weight="bold" class="section-kicker">{text.baseline_kicker}</Text>
					<WizardHelpTip tip={text.baseline_tip} />
				</div>
				<Text size="sm" class="section-copy">{text.baseline_copy}</Text>
			</div>

			<Card variant="deep" class="grid grid-cols-[auto_1fr] gap-3.5 p-4">
				<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="" aria-hidden="true" class="w-[4.25rem] h-[4.25rem] object-contain" />
				<div class="flex flex-col gap-1">
					<Text size="xs" weight="bold" class="uppercase tracking-wider clyffy-kicker">{text.guidance_kicker}</Text>
					<Text size="sm" color="secondary">{text.guidance_copy}</Text>
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
							<Card variant="solid" class="p-4 gap-3" data-role={slot.role} data-state={slot.state}>
								<div class="flex items-start justify-between gap-3">
									<div class="flex flex-col gap-0.5 min-w-0 flex-1">
										<div class="flex items-center gap-1.5">
											<span class="slot-icon shrink-0"><Icon size={18} /></span>
											<span class="slot-title">{slot.title}</span>
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
									<Text size="sm" weight="semibold">{slot.assignedName ?? text.no_assigned}</Text>
									<Text size="xs" color="muted">{slot.techLabel}</Text>
								</div>
								<div class="flex items-center gap-1.5 flex-wrap">
									{#if slot.recommended}
										<Badge variant="informative" size="sm">
											{slot.recommended.alreadyDownloaded ? text.on_disk : fill(text.recommended_size, { size: formatMb(slot.recommended.sizeMb) })}
										</Badge>
									{:else}
										<Badge variant="neutral" size="sm">{text.manual_pick}</Badge>
									{/if}
								</div>
								<div class="flex items-center gap-2 flex-wrap">
									<Button variant="secondary" size="sm" onclick={() => void handleRecommendedSlotAction(slot.slotId)}>
										{#if slot.recommended?.alreadyDownloaded}
											<Check size={14} /> {text.use_recommended}
										{:else if slot.recommended}
											<Download size={14} /> {text.download_recommended}
										{:else}
											<Sparkles size={14} /> {text.find_best_fit}
										{/if}
									</Button>
									<Button variant="ghost" size="sm" onclick={() => openSlotManager(slot.slotId, "local")}>{text.browse}</Button>
									<Button variant="ghost" size="sm" onclick={() => openSlotManager(slot.slotId, "search")}>{text.search_hf}</Button>
								</div>
							</Card>
						{/each}
					</div>
				</section>
			{/each}
		</section>

		{#if visibleSetupDownloads.length > 0 || setupInProgress}
			<Card variant="minimal" class="w-full p-4 gap-3">
				<div class="flex flex-col gap-1 w-full">
					<Text size="xs" weight="bold" color="muted" class="uppercase tracking-wide">{text.live_kicker}</Text>
					<Text size="sm" color="secondary">
						{#if visibleSetupDownloads.length > 0}
							{text.live_downloads}
						{:else}
							{text.live_applying}
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
					<Card variant="deep" class="flex items-center justify-center gap-2 p-3.5">
						<Spinner size="sm" />
						<Text size="sm" color="secondary">{text.live_assigning}</Text>
					</Card>
				{/if}
			</Card>
		{/if}

		{#if !setupComplete}
			<Button variant="primary" size="lg" onclick={handleSetup} disabled={setupInProgress} class="w-full">
				{#if setupInProgress}
					<Spinner size="md" /> {copy.setup_in_progress_label}
				{:else}
					<Download size={18} /> {copy.setup_button_label}
				{/if}
			</Button>
		{:else}
			<Card variant="deep" class="flex items-center justify-center gap-2 w-full p-3.5">
				<span class="on-disk-mark"><Check size={18} /></span>
				<Text size="sm" weight="semibold">{copy.setup_complete_message}</Text>
			</Card>
		{/if}

		{#if setupError}
			<Card variant="minimal" class="w-full p-4 gap-2" data-state="failed">
				<Text size="sm" weight="semibold">{text.error_real_title}</Text>
				<Text size="sm" color="secondary">{setupError}</Text>
				<div class="flex items-center gap-2">
					<Button variant="primary" size="sm" onclick={handleRetry}>{copy.error_retry_label}</Button>
					<Button variant="secondary" size="sm" onclick={onBrowse}>{copy.browse_link_label}</Button>
					<Button variant="ghost" size="sm" onclick={onCustomize}>{copy.error_pick_manually_label}</Button>
				</div>
			</Card>
		{/if}
	{/if}

	<div class="escape-actions">
		<Button variant="ghost" size="sm" onclick={onCustomize}>
			<Settings2 size={14} /> {copy.customize_link_label}
		</Button>
		<Button variant="ghost" size="sm" onclick={onBrowse}>
			<Search size={14} /> {copy.browse_link_label}
		</Button>
	</div>

	<VramBar />

	<div class="nav">
		<Button variant="ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} /> {copy.back_label}
		</Button>
		<Button variant="primary" size="md" onclick={onContinue} disabled={!canContinue || setupInProgress}>
			{copy.continue_label} <ArrowRight size={14} />
		</Button>
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title={text.help_button}
	summary={text.help_summary}
	points={text.help_points}
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

	.on-disk-mark {
		display: inline-flex;
		color: var(--signal-success);
	}

	.brain-meta {
		font-size: 0.875rem;
		color: var(--text-muted);
	}

	.slot-icon {
		display: inline-flex;
		color: var(--accent-teal-main);
	}

	.slot-title {
		font-size: 0.9375rem;
		font-weight: 700;
	}

	:global(.clyffy-kicker) {
		color: var(--accent-cyan-main);
	}

	.slot-card-grid :global([data-role]) {
		border-left: var(--border-width-medium) solid var(--accent-teal-main);
	}

	.models-step :global([data-state="active"]) {
		box-shadow: 0 0 0 var(--border-width-thin) var(--accent-purple-main);
	}

	.models-step :global([data-state="failed"]) {
		border-left: var(--border-width-medium) solid var(--signal-error);
	}

	@media (max-width: 48rem) {
		.slot-card-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

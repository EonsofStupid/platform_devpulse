<!--
  @file SlotAssignmentPanel.svelte
  Config-driven model assignment. Auto-detects downloaded models.
  Hardware-aware recommendations. One-click load per capability.
  GPU/CPU toggle per slot. Model detail overlay. Context length editor.
  Format-tabbed picker (GGUF/SafeTensors). Disk space warnings.
  Delete model. Full tooltips on every interactive element.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Progress } from "@devpulse/coldlight/components/progress";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import {
	AlertTriangle,
	Brain,
	Check,
	ChevronDown,
	ChevronUp,
	Cpu,
	Download,
	Eye,
	FolderOpen,
	Mic,
	Monitor,
	Power,
	PowerOff,
	Search,
	Settings2,
	Trash2,
	Volume2,
	X,
	Zap,
} from "lucide-svelte";
import { copyState, fill } from "$lib/sys/copy/index.js";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { logError } from "$lib/sys/logger.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { deleteModel } from "../../../data-access/slots.service.js";
import type { SlotId } from "../../../util/models.types.js";
import {
	calculateFit,
	contextDescription,
	fitLabel,
	formatContext,
	formatEta,
	formatMb,
	formatSpeed,
	isInferenceReady,
	quantDescription,
	vramDescription,
} from "../../../util/models.types.js";
import { translateLoadingStage } from "../../../util/terminology.js";
import HuggingFaceSearch from "../components/HuggingFaceSearch.svelte";
import {
	assignAndLoad,
	cancelActiveDownload,
	downloadAndAssign,
	downloadAndAssignFile,
	setUpRecommended,
} from "../wizard.service.js";
import { wizardState } from "../wizard.state.svelte.js";
import type { ModelRec } from "../wizard.types.js";

interface Props {
	onBrowseModels: (slotId: SlotId) => void;
	onImport: (slotId: SlotId) => void;
	onConfigure?: (slotId: SlotId) => void;
}
let { onBrowseModels, onImport, onConfigure }: Props = $props();

const text = $derived(copyState.catalog?.setup_wizard.assignment ?? null);

// ── Capability definitions (config-driven) ────────────
// Each role's look. Its name and purpose come from the copy catalog; its
// suggested model comes from the kernel's plan for this machine, never from here.
const CAPABILITY_META: Array<{
	id: SlotId;
	icon: typeof Brain;
	configLink?: string;
	color: string;
	glowColor: string;
}> = [
	{
		id: "chat.brain",
		icon: Brain,
		color: "var(--accent-teal-main)",
		glowColor: "var(--accent-teal-glow)",
	},
	{
		id: "minion.shared",
		icon: Cpu,
		color: "var(--accent-blue-main)",
		glowColor: "var(--accent-blue-glow)",
	},
	{
		id: "rag.embedder",
		icon: Search,
		color: "var(--accent-green-main)",
		glowColor: "var(--accent-green-glow)",
	},
	{
		id: "voice.stt",
		icon: Mic,
		configLink: "stt",
		color: "var(--accent-coral-main)",
		glowColor: "var(--accent-coral-glow)",
	},
	{
		id: "voice.tts",
		icon: Volume2,
		configLink: "tts",
		color: "var(--accent-hotpink-main)",
		glowColor: "var(--accent-hotpink-glow)",
	},
	{
		id: "vision.embedder",
		icon: Eye,
		color: "var(--accent-gold-main)",
		glowColor: "var(--accent-gold-glow)",
	},
];

const CAPABILITIES = $derived(
	CAPABILITY_META.map((meta) => {
		const words = text?.capabilities[meta.id];
		return {
			...meta,
			label: words?.label ?? meta.id,
			friendlyName: words?.friendly_name ?? meta.id,
			desc: words?.desc ?? "",
		};
	}),
);

// ── State ─────────────────────────────────────────────
let expandedSlot = $state<string | null>(null);
let showVramWarning = $state(false);
let pendingLoadSlot = $state<string | null>(null);
let pendingLoadModel = $state<ModelInfo | null>(null);
let tooltipVisible = $state<string | null>(null);
let tooltipTimer = $state<ReturnType<typeof setTimeout> | null>(null);
let showDetailOverlay = $state(false);
let detailModel = $state<ModelInfo | null>(null);
let loadError = $state<string | null>(null);
let pickerFormatTab = $state<Record<string, "all" | "gguf" | "safetensors">>({});
let showDeleteConfirm = $state(false);
let deleteTargetModel = $state<ModelInfo | null>(null);
let showAutoConfirm = $state(false);

// ── Tooltip helpers ───────────────────────────────────
function showTooltip(id: string) {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipTimer = setTimeout(() => {
		tooltipVisible = id;
	}, 300);
}
function hideTooltip() {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipVisible = null;
}

// ── Device preference ────────────────────────────────
// The kernel picks the device when it loads a model; `load_slot` takes no
// choice. The toggle says so instead of pretending to switch anything.
function getDevice(): "gpu" | "cpu" {
	return hardwareState.hasGpu ? "gpu" : "cpu";
}

// ── Actions ───────────────────────────────────────────
async function handleAssign(slotId: string, modelId: string): Promise<void> {
	try {
		await assignAndLoad(slotId, modelId);
		expandedSlot = null;
	} catch (e) {
		logError("wizard.assignment", `assign failed: ${String(e)}`);
	}
}
async function handleLoad(slotId: string): Promise<void> {
	loadError = null;
	try {
		await modelsState.load(slotId);
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
		logError("wizard.assignment", `load failed: ${loadError}`);
	}
}
function handleLoadWithGuard(slotId: string): void {
	const model = modelsState.assignedModel(slotId);
	if (!model) return;
	if (getDevice() === "gpu" && model.vram_estimate_mb > (hardwareState.vramFreeMb ?? 0)) {
		pendingLoadSlot = slotId;
		pendingLoadModel = model;
		showVramWarning = true;
		return;
	}
	handleLoad(slotId);
}
async function confirmVramLoad(): Promise<void> {
	showVramWarning = false;
	if (pendingLoadSlot) {
		await handleLoad(pendingLoadSlot);
		pendingLoadSlot = null;
		pendingLoadModel = null;
	}
}
async function handleUnload(slotId: string): Promise<void> {
	try {
		await modelsState.unload(slotId);
	} catch (e) {
		logError("wizard.assignment", `unload failed: ${String(e)}`);
	}
}
async function handleDownload(rec: ModelRec): Promise<void> {
	await downloadAndAssign(rec);
}
function confirmDelete(model: ModelInfo): void {
	deleteTargetModel = model;
	showDeleteConfirm = true;
}
async function executeDelete(): Promise<void> {
	if (!deleteTargetModel) return;
	showDeleteConfirm = false;
	try {
		await deleteModel(deleteTargetModel.id);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		logError("wizard.assignment", `delete failed: ${String(e)}`);
	}
	deleteTargetModel = null;
}
function deleteDetailModel(): void {
	showDetailOverlay = false;
	if (detailModel) confirmDelete(detailModel);
}
function openDetail(model: ModelInfo): void {
	detailModel = model;
	showDetailOverlay = true;
}

// ── Picker format tab per slot ───────────────────────
function getPickerFormat(slotId: string): "all" | "gguf" | "safetensors" {
	return pickerFormatTab[slotId] ?? "all";
}
function setPickerFormat(slotId: string, fmt: "all" | "gguf" | "safetensors") {
	pickerFormatTab = { ...pickerFormatTab, [slotId]: fmt };
}

// ── Currently loaded capabilities ────────────────────
const loadedCaps = $derived(
	CAPABILITIES.filter((c) => isInferenceReady(modelsState.statuses[c.id] ?? { type: "cold" })),
);

// ── Hardware tier ────────────────────────────────────
// The kernel's, through the plan it chose. Never recomputed here.
const hwTier = $derived(wizardState.selectedPresetName ?? hardwareState.tier ?? "");

// ── Model format helpers ─────────────────────────────
function isGguf(filename: string): boolean {
	return filename.toLowerCase().endsWith(".gguf");
}
function isSafetensor(filename: string): boolean {
	return filename.toLowerCase().endsWith(".safetensors");
}
function modelFormat(m: ModelInfo): string {
	if (isGguf(m.filename)) return "GGUF";
	if (isSafetensor(m.filename)) return "SafeTensors";
	if (m.filename.toLowerCase().endsWith(".bin")) return "BIN";
	if (m.filename.toLowerCase().endsWith(".onnx")) return "ONNX";
	return text?.format_unknown ?? "";
}

// ── Capability ↔ compatible models ──────────────────
function compatibleModels(slotId: string): ModelInfo[] {
	const capability = modelsState.slots.find((s) => s.id === slotId)?.capability ?? "";
	return modelsState.modelsForCapability(capability);
}
</script>

{#if text}

<div class="panel">
	<!-- ── Hardware summary bar ───────────────────────── -->
	<div class="hw-bar">
		<Zap size={14} />
		<span class="hw-text">
			{#if hardwareState.gpuName}
				{fill(text.hw_gpu, { gpu: hardwareState.gpuName, free: formatMb(hardwareState.vramFreeMb), total: formatMb(hardwareState.vramTotalMb ?? 0) })}
			{:else}
				{text.hw_cpu}
			{/if}
			{#if hardwareState.ramTotalMb} &middot; {fill(text.hw_ram, { size: formatMb(hardwareState.ramTotalMb) })}{/if}
			{#if hardwareState.diskFreeMb} &middot; {fill(text.hw_disk, { size: formatMb(hardwareState.diskFreeMb) })}{/if}
		</span>
		<span class="hw-tier">{hwTier}</span>
	</div>

	{#if loadError}
		<div class="error-box" aria-live="assertive">
			<AlertTriangle size={14} />
			<span class="error-msg">{loadError}</span>
		</div>
	{/if}

	<!-- ── Readiness dots ────────────────────────────── -->
	<div class="readiness">
		{#each CAPABILITIES as cap (cap.id)}
			{@const ready = isInferenceReady(modelsState.statuses[cap.id] ?? { type: "cold" })}
			{@const assigned = !!modelsState.assignedModel(cap.id)}
			<div class="ready-item" role="group"
				onmouseenter={() => showTooltip(`ready-${cap.id}`)}
				onmouseleave={hideTooltip}>
				<span class="dot" class:dot-ready={ready} class:dot-assigned={assigned && !ready} class:dot-empty={!assigned}></span>
				<span class="ready-label">{cap.label}</span>
				{#if tooltipVisible === `ready-${cap.id}`}
					<div class="tooltip">{fill(ready ? text.tips.ready_active : assigned ? text.tips.ready_assigned : text.tips.ready_empty, { name: cap.friendlyName })}</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- ── Quick actions ─────────────────────────────── -->
	<div class="quick-actions">
		<button class="btn-accent-lg"
			onclick={() => { showAutoConfirm = true; }}
			onmouseenter={() => showTooltip("auto-all")}
			onmouseleave={hideTooltip}
			aria-label={text.auto_aria}>
			<Zap size={16} /> {fill(text.auto_button, { tier: hwTier })}
		</button>
		{#if tooltipVisible === "auto-all"}
			<div class="tooltip">{text.tips.auto}</div>
		{/if}

		{#if wizardState.recommendations.length > 0}
			<button class="btn-outline-lg"
				onclick={() => { showAutoConfirm = true; }}
				onmouseenter={() => showTooltip("bulk-dl")}
				onmouseleave={hideTooltip}
				aria-label={text.review_aria}>
				<Download size={16} /> {text.review_button}
			</button>
			{#if tooltipVisible === "bulk-dl"}
				<div class="tooltip">{text.tips.review}</div>
			{/if}
		{/if}

		<button class="btn-outline-lg"
			onclick={() => onBrowseModels(expandedSlot ? (expandedSlot as SlotId) : "chat.brain")}
			aria-label={text.browse_aria}>
			<Search size={16} /> {text.browse_button}
		</button>
	</div>

	<!-- ── Currently loaded models bar ────────────────── -->
	{#if loadedCaps.length > 0}
		<div class="loaded-bar" aria-live="polite">
			<Check size={14} />
			<span class="loaded-text">
				{fill(text.active_count, { count: loadedCaps.length, names: loadedCaps.map((c) => c.label).join(", ") })}
			</span>
		</div>
	{/if}

	<!-- ── Capability cards ──────────────────────────── -->
	{#each CAPABILITIES as cap (cap.id)}
		{@const model = modelsState.assignedModel(cap.id)}
		{@const status = modelsState.statuses[cap.id] ?? { type: "cold" as const }}
		{@const rec = wizardState.recommendations.find((r) => r.slot === cap.id)}
		{@const dl = wizardState.downloadForSlot(cap.id)}
		{@const isLoaded = status.type === "hot" || status.type === "standby"}
		{@const isFailed = status.type === "failed"}
		{@const isExpanded = expandedSlot === cap.id}
		{@const fit = model ? calculateFit(model.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0) : "gray"}
		{@const Icon = cap.icon}
		{@const device = getDevice()}
		{@const compatModels = compatibleModels(cap.id)}
		{@const autoDetected = compatModels.length > 0 && !model}
		{@const fmt = getPickerFormat(cap.id)}

		<div class="cap-card" class:loaded={isLoaded} class:failed={isFailed}
			style:border-color={isLoaded ? cap.color : undefined}
			style:box-shadow={isLoaded ? `0 0 1.5rem 0.25rem ${cap.glowColor}` : undefined}>
			<!-- Header -->
			<div class="cap-header">
				<div class="cap-icon" style:color={cap.color}><Icon size={22} /></div>
				<div class="cap-info">
					<span class="cap-name">{cap.label}</span>
					<span class="cap-desc">{cap.desc}</span>
					{#if rec}
						<span class="cap-rec">{fill(rec.alreadyDownloaded ? text.suggested_on_disk : text.suggested_download, { name: rec.name, size: formatMb(rec.sizeMb) })}</span>
					{/if}
				</div>
				<div class="cap-right">
					<!-- GPU/CPU toggle (#40) -->
					{#if hardwareState.hasGpu}
						<button class="device-toggle" aria-disabled="true"
							onmouseenter={() => showTooltip(`device-${cap.id}`)}
							onmouseleave={hideTooltip}
							aria-label={fill(text.device_aria, { name: cap.label })}>
							{#if device === "gpu"}<Monitor size={14} /> {text.device_gpu}{:else}<Cpu size={14} /> {text.device_cpu}{/if}
						</button>
						{#if tooltipVisible === `device-${cap.id}`}
							<div class="tooltip tooltip-left">{text.tips.device_unavailable}</div>
						{/if}
					{/if}

					<!-- Status badge -->
					{#if isLoaded}<span class="badge badge-ready"><Check size={12} /> {text.status_ready}</span>
					{:else if status.type === "loading"}<span class="badge badge-loading"><Spinner size="xs" /> {text.status_loading}</span>
					{:else if isFailed}<span class="badge badge-failed"><AlertTriangle size={12} /> {text.status_failed}</span>
					{:else if model}<span class="badge badge-assigned">{text.status_assigned}</span>
					{:else}<span class="badge badge-empty">{text.status_empty}</span>{/if}
				</div>
			</div>

			<!-- Auto-detected models notification -->
			{#if autoDetected}
				<div class="detected-bar">
					<Check size={14} />
					<span>{fill(compatModels.length > 1 ? text.found_many : text.found_one, { count: compatModels.length })}</span>
					<button class="btn-sm-accent" onclick={() => handleAssign(cap.id, compatModels[0].id)}
						aria-label={fill(text.use_for_aria, { file: compatModels[0].filename, name: cap.label })}>
						{fill(text.use_file, { file: compatModels[0].filename })}
					</button>
				</div>
			{/if}

			<!-- Assigned model info -->
			{#if model}
				<div class="model-box">
					<div class="model-row-main">
						<!-- Clickable model name → detail overlay (#47) -->
						<button class="model-name-btn" onclick={() => openDetail(model)}
							onmouseenter={() => showTooltip(`detail-${cap.id}`)}
							onmouseleave={hideTooltip}
							aria-label={fill(text.detail_aria, { file: model.filename })}>
							{model.filename}
						</button>
						{#if tooltipVisible === `detail-${cap.id}`}
							<div class="tooltip">{text.tips.detail}</div>
						{/if}

						<span class="format-badge">{modelFormat(model)}</span>

						<button class="btn-icon" onclick={() => confirmDelete(model)}
							onmouseenter={() => showTooltip(`del-${cap.id}`)}
							onmouseleave={hideTooltip}
							aria-label={fill(text.delete_aria, { file: model.filename })}>
							<Trash2 size={14} />
						</button>
						{#if tooltipVisible === `del-${cap.id}`}
							<div class="tooltip tooltip-left">{text.tips.delete}</div>
						{/if}
					</div>

					<div class="model-tags">
						{#if model.quant_level}
							<span class="tag" role="group"
								onmouseenter={() => showTooltip(`q-${cap.id}`)}
								onmouseleave={hideTooltip}>
								{model.quant_level}
							</span>
							{#if tooltipVisible === `q-${cap.id}`}
								<div class="tooltip">{quantDescription(model.quant_level)}</div>
							{/if}
						{/if}
						<span class="tag">{model.architecture}</span>
						<span class="tag-muted">{formatMb(model.size_mb)}</span>
					</div>

					<!-- VRAM fit with description -->
					<div class="model-fit">
						<span class="fit-dot" data-fit={fit}></span>
						<span class="fit-text" role="group"
							onmouseenter={() => showTooltip(`fit-${cap.id}`)}
							onmouseleave={hideTooltip}>
							{vramDescription(model.vram_estimate_mb, hardwareState.vramTotalMb)} — {fitLabel(fit)}
						</span>
						{#if tooltipVisible === `fit-${cap.id}`}
							<div class="tooltip">
								{fit === "green" ? text.tips.fit_green : fit === "yellow" ? text.tips.fit_yellow : fit === "red" ? text.tips.fit_red : text.tips.fit_gray}
							</div>
						{/if}
					</div>

					<!-- Context length editor (#37) -->
					{#if model.context_length > 0}
						<div class="ctx-editor">
							<span class="ctx-label" role="group"
								onmouseenter={() => showTooltip(`ctx-${cap.id}`)}
								onmouseleave={hideTooltip}>
								{fill(text.context, { size: formatContext(model.context_length) })}
							</span>
							{#if tooltipVisible === `ctx-${cap.id}`}
								<div class="tooltip">{contextDescription(model.context_length)} — {text.tips.context_unavailable}</div>
							{/if}
							<input type="range" class="ctx-slider" disabled
								min={512} max={model.context_length} step={256}
								value={model.context_length}
								aria-label={fill(text.context_aria, { name: cap.label })} />
							<span class="ctx-val">{fill(text.tokens, { count: model.context_length.toLocaleString() })}</span>
						</div>
					{/if}
				</div>
			{:else if rec}
				<!-- Recommendation -->
				<div class="rec-box">
					<div class="rec-info">
						<span class="rec-label">{fill(text.recommended, { name: rec.name })}</span>
						<span class="rec-detail">{fill(rec.device === "cpu" ? text.rec_cpu : text.rec_gpu, { size: formatMb(rec.sizeMb), vram: formatMb(rec.vramMb) })}</span>
						<!-- Disk space warning (#14) -->
						{#if hardwareState.diskFreeMb && rec.sizeMb > hardwareState.diskFreeMb * 0.9}
							<span class="disk-warn-inline">{fill(text.low_disk, { need: formatMb(rec.sizeMb), free: formatMb(hardwareState.diskFreeMb) })}</span>
						{/if}
					</div>
					<button class="btn-accent" onclick={() => handleDownload(rec)}
						onmouseenter={() => showTooltip(`dl-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label={fill(text.download_aria, { name: rec.name, slot: cap.label })}>
						<Download size={14} /> {text.download}
					</button>
					{#if tooltipVisible === `dl-${cap.id}`}
						<div class="tooltip">{fill(text.tips.download, { name: rec.name, slot: cap.label })}</div>
					{/if}
				</div>
			{:else}
				<p class="no-model">{fill(text.no_model, { name: cap.label })}</p>
			{/if}

			<!-- Download progress -->
			{#if dl}
				{@const pct = dl.totalBytes > 0 ? Math.round((dl.bytesDownloaded / dl.totalBytes) * 100) : 0}
				{@const etaSecs = dl.speedBps > 0 ? (dl.totalBytes - dl.bytesDownloaded) / dl.speedBps : -1}
				<div class="dl-bar">
					<Progress value={pct} max={100} size="lg" />
					<div class="dl-stats">
						<span>{pct}% &middot; {formatSpeed(dl.speedBps)} &middot; {formatEta(etaSecs)}</span>
						<button class="btn-cancel" onclick={() => cancelActiveDownload(dl.downloadId)}
							aria-label={text.cancel_download_aria}><X size={14} /> {text.cancel}</button>
					</div>
				</div>
			{/if}

			<!-- Failed state with recovery -->
			{#if isFailed && "error" in status}
				<div class="error-box" aria-live="assertive">
					<AlertTriangle size={14} />
					<span class="error-msg">{status.error}</span>
					<button class="btn-accent" onclick={() => handleLoad(cap.id)}
						aria-label={fill(text.retry_aria, { name: cap.label })}>{text.retry}</button>
				</div>
			{/if}

			<!-- Loading progress -->
			{#if status.type === "loading"}
				<div class="loading-row">
					<Spinner size="sm" />
					<span>{translateLoadingStage(status.stage, status.progressPct, 0)}</span>
					<Progress value={status.progressPct} max={100} size="sm" />
				</div>
			{/if}

			<!-- Actions -->
			<div class="cap-actions">
				<button class="btn-outline" onclick={() => (expandedSlot = isExpanded ? null : cap.id)}
					onmouseenter={() => showTooltip(`pick-${cap.id}`)}
					onmouseleave={hideTooltip}
					aria-label={fill(model ? text.change_aria : text.pick_aria, { name: cap.label })}>
					{#if isExpanded}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
					{model ? text.change : text.pick}
				</button>
				{#if tooltipVisible === `pick-${cap.id}`}
					<div class="tooltip">{model ? text.tips.change : text.tips.pick}</div>
				{/if}

				{#if model && (status.type === "cold" || status.type === "warm" || isFailed)}
					<button class="btn-accent" onclick={() => handleLoadWithGuard(cap.id)}
						onmouseenter={() => showTooltip(`load-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label={fill(text.load_aria, { name: cap.friendlyName })}>
						<Power size={14} /> {text.load}
					</button>
					{#if tooltipVisible === `load-${cap.id}`}
						<div class="tooltip">{fill(text.tips.load, { name: cap.friendlyName })}</div>
					{/if}
				{/if}

				{#if isLoaded}
					<button class="btn-danger" onclick={() => handleUnload(cap.id)}
						onmouseenter={() => showTooltip(`unload-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label={fill(text.unload_aria, { name: cap.friendlyName })}>
						<PowerOff size={14} /> {text.unload}
					</button>
					{#if tooltipVisible === `unload-${cap.id}`}
						<div class="tooltip">{fill(text.tips.unload, { size: formatMb(model?.vram_estimate_mb ?? 0) })}</div>
					{/if}
				{/if}

				{#if cap.configLink}
					<button class="btn-outline" onclick={() => onConfigure?.(cap.id)}
						onmouseenter={() => showTooltip(`cfg-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label={fill(text.configure_aria, { name: cap.label })}>
						<Settings2 size={14} /> {text.configure}
					</button>
					{#if tooltipVisible === `cfg-${cap.id}`}
						<div class="tooltip">{fill(text.tips.configure, { name: cap.label })}</div>
					{/if}
				{/if}

				<button class="btn-icon-sm" onclick={() => onImport(cap.id)}
					onmouseenter={() => showTooltip(`imp-${cap.id}`)}
					onmouseleave={hideTooltip}
					aria-label={fill(text.import_aria, { name: cap.label })}>
					<FolderOpen size={14} />
				</button>
				{#if tooltipVisible === `imp-${cap.id}`}
					<div class="tooltip">{fill(text.tips.import, { name: cap.label })}</div>
				{/if}
			</div>

			<!-- Model picker with format tabs -->
			{#if isExpanded}
				{@const filteredModels = compatModels.filter((m) =>
					fmt === "all" ? true :
					fmt === "gguf" ? isGguf(m.filename) :
					isSafetensor(m.filename)
				)}
				<div class="picker">
					<!-- Format tabs in picker -->
					<div class="picker-header">
						<span class="picker-title">{fill(text.compatible, { count: compatModels.length })}</span>
						<div class="picker-tabs">
							<button class="picker-tab" class:active={fmt === "all"} onclick={() => setPickerFormat(cap.id, "all")}>{text.all}</button>
							<button class="picker-tab" class:active={fmt === "gguf"} onclick={() => setPickerFormat(cap.id, "gguf")}
								onmouseenter={() => showTooltip(`ptab-gguf-${cap.id}`)} onmouseleave={hideTooltip}>
								GGUF
							</button>
							<button class="picker-tab" class:active={fmt === "safetensors"} onclick={() => setPickerFormat(cap.id, "safetensors")}
								onmouseenter={() => showTooltip(`ptab-st-${cap.id}`)} onmouseleave={hideTooltip}>
								SafeTensors
							</button>
							{#if tooltipVisible === `ptab-gguf-${cap.id}`}
								<div class="tooltip">{text.tips.gguf}</div>
							{/if}
							{#if tooltipVisible === `ptab-st-${cap.id}`}
								<div class="tooltip">{text.tips.safetensors}</div>
							{/if}
						</div>
					</div>

					{#if filteredModels.length === 0}
						<p class="picker-empty">
							{compatModels.length > 0
								? fill(text.no_format, { format: fmt === "gguf" ? "GGUF" : "SafeTensors" })
								: text.none_compatible}
						</p>
					{/if}

					{#each filteredModels as m (m.id)}
						{@const mFit = calculateFit(m.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0)}
						<button class="picker-row" class:active={model?.id === m.id}
							onclick={() => handleAssign(cap.id, m.id)}
							aria-label={fill(text.assign_aria, { file: m.filename, name: cap.label })}>
							<span class="picker-name">{m.filename}</span>
							<span class="format-badge-sm">{modelFormat(m)}</span>
							{#if m.quant_level}<span class="tag">{m.quant_level}</span>{/if}
							<span class="tag-muted">{m.architecture}</span>
							<span class="tag-muted">{formatMb(m.size_mb)}</span>
							<span class="tag-muted">{fill(text.vram, { size: formatMb(m.vram_estimate_mb) })}</span>
							<span class="fit-dot" data-fit={mFit}></span>
							<span class="fit-text">{fitLabel(mFit)}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

	<!-- Empty state -->
	{#if modelsState.userSlots.length === 0}
		<div class="empty"><p>{text.waiting}</p></div>
	{/if}

	<!-- Summary -->
	<p class="summary">
		{fill(text.summary, { models: modelsState.models.length, assigned: CAPABILITIES.filter((c) => modelsState.assignedModel(c.id)).length, total: CAPABILITIES.length })}
		{#if hardwareState.diskFreeMb} &middot; {fill(text.hw_disk, { size: formatMb(hardwareState.diskFreeMb) })}{/if}
	</p>

	<!-- HuggingFace search -->
	<hr class="divider" />
	<HuggingFaceSearch
		onDownload={(repoId, filename, targetSlot) => downloadAndAssignFile(repoId, filename, targetSlot as SlotId)}
	/>

	<!-- ═══════ OVERLAYS ═══════ -->

	<!-- VRAM warning dialog -->
	{#if showVramWarning && pendingLoadModel}
		<div class="dialog-backdrop" role="button" tabindex="0" aria-label={text.close_dialog}
			onclick={() => { showVramWarning = false; }}
			onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") showVramWarning = false; }}>
			<div class="dialog" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" tabindex="-1"
				onkeydown={(e) => { if (e.key === "Escape") showVramWarning = false; }}>
				<h3 class="dialog-title"><AlertTriangle size={18} /> {text.too_large_title}</h3>
				<p class="dialog-msg">
					{fill(text.too_large_copy, { file: pendingLoadModel.filename, need: formatMb(pendingLoadModel.vram_estimate_mb), free: formatMb(hardwareState.vramFreeMb) })}
				</p>
				<div class="dialog-actions">
					<button class="btn-outline" onclick={() => { showVramWarning = false; }}
						aria-label={text.cancel_load_aria}>{text.cancel}</button>
					<button class="btn-accent" onclick={confirmVramLoad}
						aria-label={text.load_anyway}>{text.load_anyway}</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete confirmation dialog (#46) -->
	{#if showDeleteConfirm && deleteTargetModel}
		<div class="dialog-backdrop" role="button" tabindex="0" aria-label={text.close_dialog}
			onclick={() => { showDeleteConfirm = false; }}
			onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") showDeleteConfirm = false; }}>
			<div class="dialog" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" tabindex="-1"
				onkeydown={(e) => { if (e.key === "Escape") showDeleteConfirm = false; }}>
				<h3 class="dialog-title"><Trash2 size={18} /> {text.delete_title}</h3>
				<p class="dialog-msg">
					{fill(text.delete_copy, { file: deleteTargetModel.filename, size: formatMb(deleteTargetModel.size_mb) })}
				</p>
				<div class="dialog-actions">
					<button class="btn-outline" onclick={() => { showDeleteConfirm = false; }}
						aria-label={text.cancel_delete_aria}>{text.cancel}</button>
					<button class="btn-delete" onclick={executeDelete}
						aria-label={text.delete_confirm}>{text.delete_confirm}</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Model detail overlay (#47) -->
	{#if showDetailOverlay && detailModel}
		<div class="dialog-backdrop" role="button" tabindex="0" aria-label={text.close_dialog}
			onclick={() => { showDetailOverlay = false; }}
			onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") showDetailOverlay = false; }}>
			<div class="detail-overlay" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1"
				onkeydown={(e) => { if (e.key === "Escape") showDetailOverlay = false; }}>
				<div class="detail-header">
					<h3 class="detail-title">{detailModel.filename}</h3>
					<button class="btn-icon" onclick={() => { showDetailOverlay = false; }}
						aria-label={text.close_detail}><X size={18} /></button>
				</div>

				<div class="detail-grid">
					<div class="detail-row">
						<span class="detail-label">{text.detail_format}</span>
						<span class="detail-value">{modelFormat(detailModel)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">{text.detail_architecture}</span>
						<span class="detail-value">{detailModel.architecture}</span>
					</div>
					{#if detailModel.quant_level}
						<div class="detail-row">
							<span class="detail-label">{text.detail_quantization}</span>
							<span class="detail-value">{detailModel.quant_level} &mdash; {quantDescription(detailModel.quant_level)}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">{text.detail_file_size}</span>
						<span class="detail-value">{formatMb(detailModel.size_mb)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">{text.detail_vram}</span>
						<span class="detail-value">{vramDescription(detailModel.vram_estimate_mb, hardwareState.vramTotalMb)}</span>
					</div>
					{#if detailModel.context_length > 0}
						<div class="detail-row">
							<span class="detail-label">{text.detail_context}</span>
							<span class="detail-value">{fill(text.tokens, { count: detailModel.context_length.toLocaleString() })} &mdash; {contextDescription(detailModel.context_length)}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">{text.detail_fit}</span>
						<span class="detail-value">
							<span class="fit-dot" data-fit={calculateFit(detailModel.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0)}></span>
							{fitLabel(calculateFit(detailModel.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0))}
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">{text.detail_compatible}</span>
						<span class="detail-value">{detailModel.compatible_capabilities.join(", ")}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">{text.detail_id}</span>
						<span class="detail-value detail-mono">{detailModel.id}</span>
					</div>
				</div>

				<div class="detail-actions">
					<button class="btn-delete" onclick={deleteDetailModel}
						aria-label={text.delete_detail}>
						<Trash2 size={14} /> {text.delete_detail}
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Auto-configure confirmation overlay -->
	{#if showAutoConfirm}
		<div class="dialog-backdrop" role="button" tabindex="0" aria-label={text.close_dialog}
			onclick={() => { showAutoConfirm = false; }}
			onkeydown={(e) => { if (e.key === "Enter" || e.key === " ") showAutoConfirm = false; }}>
			<div class="confirm-overlay" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1"
				onkeydown={(e) => { if (e.key === "Escape") showAutoConfirm = false; }}>
				<h3 class="confirm-title"><Zap size={20} /> {text.review_title}</h3>
				<p class="confirm-desc">
					{fill(text.review_copy, { tier: hwTier, gpu: hardwareState.gpuName ?? text.device_cpu, vram: formatMb(hardwareState.vramTotalMb ?? 0) })}
				</p>

				<div class="confirm-list">
					{#each CAPABILITIES as cap (cap.id)}
						{@const rec = wizardState.recommendations.find((r) => r.slot === cap.id)}
						{@const existing = modelsState.assignedModel(cap.id)}
						{@const Icon = cap.icon}
						<div class="confirm-row">
							<div class="confirm-icon" style:color={cap.color}><Icon size={18} /></div>
							<div class="confirm-info">
								<span class="confirm-cap">{cap.label}</span>
								{#if existing}
									<span class="confirm-current">{fill(text.already_assigned, { file: existing.filename })}</span>
								{:else if rec}
									<span class="confirm-rec">{fill(rec.alreadyDownloaded ? text.will_assign_on_disk : text.will_assign_download, { name: rec.name, size: formatMb(rec.sizeMb) })}</span>
								{:else}
									<span class="confirm-none">{text.no_recommendation}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if wizardState.recommendations.length > 0}
					{@const totalDownload = wizardState.recommendations.filter((r) => !r.alreadyDownloaded).reduce((a, r) => a + r.sizeMb, 0)}
					{@const alreadyHave = wizardState.recommendations.filter((r) => r.alreadyDownloaded).length}
					<div class="confirm-summary">
						{#if totalDownload > 0}
							<span>{fill(text.will_download, { size: formatMb(totalDownload), count: wizardState.recommendations.length - alreadyHave })}</span>
						{/if}
						{#if alreadyHave > 0}
							<span>{fill(alreadyHave > 1 ? text.on_disk_many : text.on_disk_one, { count: alreadyHave })}</span>
						{/if}
						{#if hardwareState.diskFreeMb && totalDownload > (hardwareState.diskFreeMb ?? 0) * 0.9}
							<span class="disk-warn-confirm">{fill(text.low_disk, { need: formatMb(totalDownload), free: formatMb(hardwareState.diskFreeMb) })}</span>
						{/if}
					</div>
				{/if}

				<div class="confirm-actions">
					<button class="btn-outline" onclick={() => { showAutoConfirm = false; }}
						aria-label={text.cancel_auto_aria}>{text.cancel}</button>
					<button class="btn-accent-lg" onclick={() => { showAutoConfirm = false; void setUpRecommended(wizardState.recommendations); }}
						aria-label={text.approve}>
						<Zap size={16} /> {text.approve}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
{/if}

<style>
	.panel { display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1;padding:0.25rem; }

	/* Hardware bar */
	.hw-bar { display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.875rem;border-radius:0.5rem;background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);color:var(--text-muted); }
	.hw-text { flex:1;font-size:0.9375rem; }
	.hw-tier { font-size:0.875rem;font-weight:700;padding:0.125rem 0.5rem;border-radius:0.25rem;background:var(--surface-overlay);color:var(--accent-teal-main);text-transform:uppercase; }

	/* Readiness */
	.readiness { display:flex;gap:1rem;align-items:center;flex-wrap:wrap; }
	.ready-item { display:flex;align-items:center;gap:0.375rem;position:relative; }
	.ready-label { font-size:0.9375rem;color:var(--text-secondary); }
	.dot { width:0.5rem;height:0.5rem;border-radius:var(--radius-full);background:var(--surface-overlay); }
	.dot-ready { background:var(--signal-success); }
	.dot-assigned { background:var(--signal-warning); }
	.dot-empty { background:var(--surface-overlay); }

	/* Quick actions */
	.quick-actions { display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;position:relative; }

	/* Loaded bar (#20) */
	.loaded-bar { display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:color-mix(in oklch, var(--signal-success) 15%, transparent);border:var(--border-width-thin) solid color-mix(in oklch, var(--signal-success) 30%, transparent);color:var(--signal-success);font-size:0.9375rem; }
	.loaded-text { flex:1; }

	/* Capability card */
	.cap-card { background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.75rem;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;backdrop-filter:blur(0.75rem);transition:border-color var(--duration-fast),box-shadow var(--duration-fast); }

	.cap-card.failed { border-color:var(--signal-error);box-shadow:0 0 1rem 0.25rem color-mix(in oklch, var(--signal-error) 35%, transparent); }

	.cap-header { display:flex;align-items:flex-start;gap:0.75rem; }
	.cap-icon { flex-shrink:0;margin-top:0.125rem; }
	.cap-info { flex:1;min-width:0; }
	.cap-name { display:block;font-size:0.9375rem;font-weight:700;color:var(--text-primary); }
	.cap-desc { display:block;font-size:0.9375rem;color:var(--text-muted);margin-top:0.125rem; }
	.cap-rec { display:block;font-size:0.875rem;color:var(--accent-teal-main);margin-top:0.25rem;font-style:italic; }
	.cap-right { display:flex;align-items:center;gap:0.5rem;flex-shrink:0; }
	.cap-actions { display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;position:relative; }

	/* Device toggle (#40) */
	.device-toggle { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.625rem;border-radius:0.375rem;border:var(--border-width-thin) solid var(--border-subtle);background:var(--surface-raised);color:var(--text-secondary);font-size:0.875rem;font-weight:600;cursor:pointer;position:relative; }
	.device-toggle:hover { background:var(--surface-overlay); }

	/* Badges */
	.badge { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.625rem;border-radius:var(--radius-full);font-size:0.875rem;font-weight:600; }
	.badge-ready { background:color-mix(in oklch, var(--signal-success) 30%, transparent);color:var(--signal-success); }
	.badge-loading { background:color-mix(in oklch, var(--signal-warning) 30%, transparent);color:var(--signal-warning); }
	.badge-failed { background:color-mix(in oklch, var(--signal-error) 30%, transparent);color:var(--signal-error); }
	.badge-assigned { background:var(--surface-overlay);color:var(--accent-teal-main); }
	.badge-empty { background:var(--surface-overlay);color:var(--text-muted); }

	/* Detected bar */
	.detected-bar { display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.75rem;border-radius:0.5rem;background:color-mix(in oklch, var(--signal-success) 15%, transparent);border:var(--border-width-thin) solid color-mix(in oklch, var(--signal-success) 30%, transparent);color:var(--signal-success);font-size:0.9375rem; }
	.detected-bar span { flex:1; }

	/* Model box */
	.model-box { background:var(--surface-raised);border-radius:0.5rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem; }
	.model-row-main { display:flex;align-items:center;gap:0.5rem;position:relative; }
	.model-name-btn { flex:1;font-size:0.875rem;font-weight:600;color:var(--accent-teal-main);background:none;border:none;cursor:pointer;text-align:left;padding:0;text-decoration:underline;text-decoration-color:color-mix(in oklch, var(--accent-teal-main) 30%, transparent);text-underline-offset:0.125rem; }
	.model-name-btn:hover { color:var(--accent-teal-main);text-decoration-color:var(--accent-teal-main); }
	.format-badge { font-size:0.6875rem;font-weight:700;padding:0.125rem 0.375rem;border-radius:0.25rem;background:var(--surface-overlay);color:var(--accent-blue-main);text-transform:uppercase; }
	.format-badge-sm { font-size:0.625rem;font-weight:700;padding:0.0625rem 0.25rem;border-radius:0.1875rem;background:var(--surface-overlay);color:var(--accent-blue-main);text-transform:uppercase; }
	.model-tags { display:flex;flex-wrap:wrap;gap:0.375rem;align-items:center;position:relative; }
	.model-fit { display:flex;align-items:center;gap:0.375rem;position:relative; }
	.fit-dot { width:0.5rem;height:0.5rem;border-radius:var(--radius-full);flex-shrink:0;background:var(--text-muted); }
	.fit-dot[data-fit="green"] { background:var(--signal-success); }
	.fit-dot[data-fit="yellow"] { background:var(--signal-warning); }
	.fit-dot[data-fit="red"] { background:var(--signal-error); }
	.fit-text { font-size:0.9375rem;color:var(--text-muted);cursor:help; }

	/* Context length editor (#37) */
	.ctx-editor { display:flex;align-items:center;gap:0.5rem;position:relative; }
	.ctx-label { font-size:0.9375rem;color:var(--text-muted);cursor:help;white-space:nowrap; }
	.ctx-slider { flex:1;height:0.25rem;accent-color:var(--accent-teal-main);cursor:pointer; }
	.ctx-val { font-size:0.875rem;color:var(--text-muted);white-space:nowrap;min-width:5rem;text-align:right; }

	/* Tags */
	.tag { font-size:0.875rem;padding:0.125rem 0.5rem;border-radius:0.25rem;background:var(--surface-overlay);color:var(--text-primary);cursor:help;position:relative; }
	.tag-muted { font-size:0.9375rem;color:var(--text-muted); }

	/* Recommendation */
	.rec-box { display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.5rem;border:var(--border-width-thin) dashed color-mix(in oklch, var(--accent-teal-main) 40%, transparent);background:var(--surface-inset);position:relative; }
	.rec-info { flex:1; }
	.rec-label { display:block;font-size:0.875rem;font-weight:600;color:var(--text-primary); }
	.rec-detail { display:block;font-size:0.875rem;color:var(--text-muted); }
	.disk-warn-inline { display:block;font-size:0.875rem;color:var(--signal-error);margin-top:0.25rem; }
	.no-model { font-size:0.875rem;color:var(--text-muted);font-style:italic;margin:0; }

	/* Download */
	.dl-bar { background:var(--surface-raised);border-radius:0.5rem;padding:0.75rem; }
	.dl-stats { display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;font-size:0.9375rem;color:var(--text-muted); }

	/* Error */
	.error-box { display:flex;align-items:center;gap:0.5rem;padding:0.75rem;border-radius:0.5rem;background:color-mix(in oklch, var(--signal-error) 25%, transparent);border:var(--border-width-thin) solid color-mix(in oklch, var(--signal-error) 40%, transparent);color:var(--signal-error);font-size:0.9375rem; }
	.error-msg { flex:1; }

	/* Loading */
	.loading-row { display:flex;align-items:center;gap:0.5rem;font-size:0.9375rem;color:var(--text-muted); }

	/* Picker */
	.picker { background:var(--surface-raised);border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.5rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.25rem;animation:expand var(--duration-fast) ease-out; }
	.picker-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;flex-wrap:wrap;gap:0.375rem; }
	.picker-title { font-size:0.9375rem;font-weight:700;color:var(--text-secondary); }
	.picker-tabs { display:flex;gap:0.125rem;background:var(--surface-inset);border-radius:0.375rem;padding:0.125rem;position:relative; }
	.picker-tab { padding:0.25rem 0.625rem;border-radius:0.25rem;border:none;background:transparent;color:var(--text-muted);font-size:0.875rem;font-weight:600;cursor:pointer; }
	.picker-tab.active { background:var(--surface-overlay);color:var(--accent-teal-main); }
	.picker-empty { font-size:0.9375rem;color:var(--text-muted);margin:0; }
	.picker-row { display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.5rem;border-radius:0.375rem;border:none;background:transparent;cursor:pointer;font-size:0.9375rem;color:var(--text-primary);text-align:left; }
	.picker-row:hover { background:var(--surface-overlay); }
	.picker-row.active { outline:var(--border-width-medium) solid var(--accent-teal-main);outline-offset:-0.125rem; }
	.picker-name { flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }

	/* Tooltip */
	.tooltip { position:absolute;z-index:40;bottom:calc(100% + 0.5rem);left:50%;transform:translateX(-50%);white-space:normal;max-width:20rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);color:var(--text-primary);font-size:0.875rem;line-height:1.4;box-shadow:0 0.25rem 0.75rem var(--border-soft);pointer-events:none;animation:fade-in var(--duration-fast) ease-out; }
	.tooltip-left { left:auto;right:0;transform:none; }

	/* Buttons */
	.btn-accent { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:none;background:var(--accent-teal-main);color:var(--surface-base);font-size:0.9375rem;font-weight:700;cursor:pointer;transition:filter var(--duration-fast); }
	.btn-accent:hover { filter:brightness(1.15); }
	.btn-accent-lg { display:inline-flex;align-items:center;gap:0.5rem;padding:0.625rem 1.5rem;border-radius:0.625rem;border:none;background:var(--accent-teal-main);color:var(--surface-base);font-size:0.9375rem;font-weight:800;cursor:pointer;box-shadow:0 0 1.25rem color-mix(in oklch, var(--accent-teal-main) 30%, transparent); }
	.btn-accent-lg:hover { filter:brightness(1.15);box-shadow:0 0 2rem color-mix(in oklch, var(--accent-teal-main) 50%, transparent); }
	.btn-outline { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:var(--border-width-thin) solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:0.9375rem;cursor:pointer; }
	.btn-outline:hover { background:var(--surface-raised); }
	.btn-outline-lg { display:inline-flex;align-items:center;gap:0.5rem;padding:0.625rem 1.5rem;border-radius:0.625rem;border:var(--border-width-thin) solid var(--border-subtle);background:transparent;color:var(--text-secondary);font-size:0.9375rem;cursor:pointer; }
	.btn-danger { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:var(--border-width-thin) solid color-mix(in oklch, var(--signal-error) 40%, transparent);background:transparent;color:var(--signal-error);font-size:0.9375rem;cursor:pointer; }
	.btn-cancel { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.5rem;border:none;background:transparent;color:var(--signal-error);font-size:0.9375rem;cursor:pointer; }
	.btn-icon { background:none;border:none;color:var(--text-muted);cursor:pointer;padding:0.25rem;position:relative; }
	.btn-icon:hover { color:var(--signal-error); }
	.btn-icon-sm { background:none;border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.375rem;color:var(--text-muted);cursor:pointer;padding:0.375rem;position:relative; }
	.btn-icon-sm:hover { background:var(--surface-raised); }
	.btn-sm-accent { padding:0.25rem 0.625rem;border-radius:0.375rem;border:none;background:var(--accent-teal-main);color:var(--surface-base);font-size:0.875rem;font-weight:700;cursor:pointer; }
	.btn-delete { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:none;background:var(--signal-error);color:var(--text-primary);font-size:0.9375rem;font-weight:700;cursor:pointer; }
	.btn-delete:hover { filter:brightness(1.1); }

	/* Dialog */
	.dialog-backdrop { position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:var(--surface-inset); }
	.dialog { width:100%;max-width:28rem;margin:1rem;padding:1.5rem;background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.75rem; }
	.dialog-title { display:flex;align-items:center;gap:0.5rem;font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0 0 0.5rem; }
	.dialog-msg { font-size:0.875rem;color:var(--text-secondary);margin:0 0 1.5rem;line-height:1.5; }
	.dialog-actions { display:flex;justify-content:flex-end;gap:0.75rem; }

	/* Detail overlay (#47) */
	.detail-overlay { width:100%;max-width:32rem;margin:1rem;padding:1.5rem;background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.75rem;max-height:80vh;overflow-y:auto; }
	.detail-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem; }
	.detail-title { font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0;word-break:break-all; }
	.detail-grid { display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem; }
	.detail-row { display:flex;gap:0.75rem;padding:0.5rem 0;border-bottom:var(--border-width-thin) solid var(--border-subtle); }
	.detail-label { width:8rem;flex-shrink:0;font-size:0.9375rem;font-weight:600;color:var(--text-muted); }
	.detail-value { flex:1;font-size:0.875rem;color:var(--text-primary);display:flex;align-items:center;gap:0.375rem; }
	.detail-mono { font-family:monospace;font-size:0.9375rem;color:var(--text-muted);word-break:break-all; }
	.detail-actions { display:flex;justify-content:flex-end;gap:0.75rem; }

	/* Misc */
	.divider { border:none;border-top:var(--border-width-thin) solid var(--border-subtle);margin:0.5rem 0; }
	.summary { text-align:center;font-size:0.9375rem;color:var(--text-muted);margin:0; }
	.empty { text-align:center;padding:3rem 0;color:var(--text-muted); }

	@keyframes expand { from{opacity:0;transform:translateY(-0.5rem)} to{opacity:1;transform:translateY(0)} }
	/* Auto-configure confirmation overlay */
	.confirm-overlay { width:100%;max-width:36rem;margin:1rem;padding:1.5rem;background:var(--surface-inset);border:var(--border-width-thin) solid var(--border-subtle);border-radius:0.75rem;max-height:85vh;overflow-y:auto; }
	.confirm-title { display:flex;align-items:center;gap:0.5rem;font-size:1.25rem;font-weight:800;color:var(--text-primary);margin:0 0 0.5rem; }
	.confirm-desc { font-size:1rem;color:var(--text-secondary);margin:0 0 1rem;line-height:1.5; }
	.confirm-list { display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem; }
	.confirm-row { display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.5rem;background:var(--surface-raised);border:var(--border-width-thin) solid var(--border-subtle); }
	.confirm-icon { flex-shrink:0; }
	.confirm-info { flex:1; }
	.confirm-cap { display:block;font-size:1rem;font-weight:700;color:var(--text-primary); }
	.confirm-current { display:block;font-size:0.9375rem;color:var(--signal-success); }
	.confirm-rec { display:block;font-size:0.9375rem;color:var(--accent-teal-main); }
	.confirm-none { display:block;font-size:0.9375rem;color:var(--text-muted);font-style:italic; }
	.confirm-summary { display:flex;flex-direction:column;gap:0.25rem;padding:0.75rem;border-radius:0.5rem;background:var(--surface-inset);margin-bottom:1rem;font-size:0.9375rem;color:var(--text-secondary); }
	.disk-warn-confirm { color:var(--signal-error);font-weight:600; }
	.confirm-actions { display:flex;justify-content:flex-end;gap:0.75rem; }

	@keyframes expand { from{opacity:0;transform:translateY(-0.5rem)} to{opacity:1;transform:translateY(0)} }
	@keyframes fade-in { from{opacity:0} to{opacity:1} }
</style>

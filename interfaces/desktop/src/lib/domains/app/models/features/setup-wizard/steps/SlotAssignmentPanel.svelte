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
import {
	AlertTriangle,
	Brain,
	Check,
	ChevronDown,
	ChevronUp,
	Cpu,
	Download,
	Eye,
	FileText,
	FolderOpen,
	HardDrive,
	Info,
	Layers,
	LoaderCircle,
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
import { Progress } from "$lib/design/components/progress/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { SlotId } from "../../../types/models.types.js";
import {
	calculateFit,
	contextDescription,
	fitColor,
	fitLabel,
	formatContext,
	formatEta,
	formatMb,
	formatSpeed,
	friendlySlotLabel,
	isInferenceReady,
	quantDescription,
	vramDescription,
} from "../../../types/models.types.js";
import { translateLoadingStage } from "../../../utils/terminology.js";
import { wizardState } from "../wizard.runes.svelte.js";
import {
	assignAndLoad,
	autoAssignAllSlots,
	bulkDownloadAndAssign,
	cancelActiveDownload,
	downloadAndAssign,
} from "../wizard.service.js";
import type { ModelRec } from "../wizard.types.js";
import HuggingFaceSearch from "./HuggingFaceSearch.svelte";

interface Props {
	onBrowseModels: () => void;
	onImport: (slotId: SlotId) => void;
}
let { onBrowseModels, onImport }: Props = $props();

// ── Capability definitions (config-driven) ────────────
const CAPABILITIES: Array<{
	id: SlotId;
	icon: typeof Brain;
	label: string;
	friendlyName: string;
	desc: string;
	recModel: string;
	recNote: string;
	configLink?: string;
	color: string;
	glowColor: string;
}> = [
	{
		id: "chat.brain",
		icon: Brain,
		label: "Brain",
		friendlyName: "Main AI",
		desc: "Talks to you, writes code, answers questions",
		recModel: "Qwen3.5-4B",
		recNote: "Best for 3060 + 16GB RAM",
		color: "oklch(0.82 0.14 195)",
		glowColor: "oklch(0.82 0.14 195 / 0.4)",
	},
	{
		id: "minion.shared",
		icon: Cpu,
		label: "Quick Helper",
		friendlyName: "Helper",
		desc: "Fast background tasks — summarizing, formatting",
		recModel: "Qwen3-0.6B",
		recNote: "Tiny, runs alongside main brain",
		color: "oklch(0.68 0.14 240)",
		glowColor: "oklch(0.68 0.14 240 / 0.4)",
	},
	{
		id: "rag.embedder",
		icon: Search,
		label: "Search Engine",
		friendlyName: "Embedder",
		desc: "Turns your docs into searchable vectors",
		recModel: "Nomic-Embed-0.6B",
		recNote: "Small, fast, CPU-friendly",
		color: "oklch(0.66 0.17 155)",
		glowColor: "oklch(0.66 0.17 155 / 0.4)",
	},
	{
		id: "voice.stt",
		icon: Mic,
		label: "Ears (Speech-to-Text)",
		friendlyName: "STT",
		desc: "Converts your voice into text",
		recModel: "Whisper Small",
		recNote: "Best speed/accuracy balance",
		configLink: "stt",
		color: "oklch(0.65 0.22 10)",
		glowColor: "oklch(0.65 0.22 10 / 0.4)",
	},
	{
		id: "voice.tts",
		icon: Volume2,
		label: "Voice (Text-to-Speech)",
		friendlyName: "TTS",
		desc: "Speaks AI responses out loud",
		recModel: "Kokoro int8",
		recNote: "88MB, bundled with app",
		configLink: "tts",
		color: "oklch(0.62 0.26 340)",
		glowColor: "oklch(0.62 0.26 340 / 0.4)",
	},
	{
		id: "vision.encoder" as SlotId,
		icon: Eye,
		label: "Eyes (Vision)",
		friendlyName: "Vision",
		desc: "Understands screenshots and diagrams",
		recModel: "SigLIP2-0.6B",
		recNote: "Small vision encoder",
		color: "oklch(0.83 0.16 100)",
		glowColor: "oklch(0.83 0.16 100 / 0.4)",
	},
];

// ── State ─────────────────────────────────────────────
let expandedSlot = $state<string | null>(null);
let showVramWarning = $state(false);
let pendingLoadSlot = $state<string | null>(null);
let pendingLoadModel = $state<ModelInfo | null>(null);
let tooltipVisible = $state<string | null>(null);
let tooltipTimer = $state<ReturnType<typeof setTimeout> | null>(null);
let deviceOverride = $state<Record<string, "gpu" | "cpu">>({});
let showDetailOverlay = $state(false);
let detailModel = $state<ModelInfo | null>(null);
let pickerFormatTab = $state<Record<string, "all" | "gguf" | "safetensors">>({});
let showDeleteConfirm = $state(false);
let deleteTargetModel = $state<ModelInfo | null>(null);
let contextOverride = $state<Record<string, number>>({});
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
function getDevice(slotId: string): "gpu" | "cpu" {
	return deviceOverride[slotId] ?? (hardwareState.hasGpu ? "gpu" : "cpu");
}
function toggleDevice(slotId: string) {
	const current = getDevice(slotId);
	deviceOverride = { ...deviceOverride, [slotId]: current === "gpu" ? "cpu" : "gpu" };
}

// ── Actions ───────────────────────────────────────────
async function handleAssign(slotId: string, modelId: string): Promise<void> {
	try {
		await assignAndLoad(slotId, modelId);
		expandedSlot = null;
	} catch {}
}
async function handleLoad(slotId: string): Promise<void> {
	try {
		const ctx = contextOverride[slotId];
		const device = getDevice(slotId);
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("load_slot", { slotId, device, contextLength: ctx ?? null });
	} catch {}
}
function handleLoadWithGuard(slotId: string): void {
	const model = modelsState.assignedModel(slotId);
	if (!model) return;
	const device = getDevice(slotId);
	if (
		device === "gpu" &&
		hardwareState.hasGpu &&
		model.vram_estimate_mb > (hardwareState.vramFreeMb ?? 0)
	) {
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
		deviceOverride = { ...deviceOverride, [pendingLoadSlot]: "cpu" };
		await handleLoad(pendingLoadSlot);
		pendingLoadSlot = null;
		pendingLoadModel = null;
	}
}
async function handleUnload(slotId: string): Promise<void> {
	try {
		await modelsState.unload(slotId);
	} catch {}
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
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("delete_model", { modelId: deleteTargetModel.id });
		await modelsState.scan();
		await modelsState.refresh();
	} catch {}
	deleteTargetModel = null;
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

// ── Context length helpers ───────────────────────────
function getContextOverride(slotId: string, model: ModelInfo | undefined): number {
	return contextOverride[slotId] ?? model?.context_length ?? 0;
}
function setContextLength(slotId: string, value: number) {
	contextOverride = { ...contextOverride, [slotId]: value };
}

// ── Currently loaded capabilities ────────────────────
const loadedCaps = $derived(
	CAPABILITIES.filter((c) => isInferenceReady(modelsState.statuses[c.id] ?? { type: "cold" })),
);

// ── Hardware tier ────────────────────────────────────
const hwTier = $derived.by(() => {
	const vram = hardwareState.vramTotalMb ?? 0;
	if (vram >= 16000) return "prosumer";
	if (vram >= 8000) return "mainstream";
	if (vram >= 4000) return "entry";
	return "potato";
});

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
	return "Unknown";
}

// ── Capability ↔ compatible models ──────────────────
function capabilityFilter(capId: string): string {
	if (capId.startsWith("voice.stt")) return "speech_to_text";
	if (capId.startsWith("voice.tts")) return "text_to_speech";
	if (capId.startsWith("vision")) return "vision";
	if (capId.startsWith("rag")) return "embedding";
	return "text_generation";
}
</script>

<div class="panel">
	<!-- ── Hardware summary bar ───────────────────────── -->
	<div class="hw-bar">
		<Zap size={14} />
		<span class="hw-text">
			{#if hardwareState.gpuName}
				{hardwareState.gpuName} &middot; {formatMb(hardwareState.vramFreeMb ?? 0)} VRAM free / {formatMb(hardwareState.vramTotalMb ?? 0)}
			{:else}
				CPU only &middot; No GPU detected
			{/if}
			{#if hardwareState.ramTotalMb} &middot; {formatMb(hardwareState.ramTotalMb)} RAM{/if}
			{#if hardwareState.diskFreeMb} &middot; {formatMb(hardwareState.diskFreeMb)} disk free{/if}
		</span>
		<span class="hw-tier">{hwTier}</span>
	</div>

	<!-- ── Readiness dots ────────────────────────────── -->
	<div class="readiness">
		{#each CAPABILITIES as cap (cap.id)}
			{@const ready = isInferenceReady(modelsState.statuses[cap.id] ?? { type: "cold" })}
			{@const assigned = !!modelsState.assignedModel(cap.id)}
			<div class="ready-item"
				onmouseenter={() => showTooltip(`ready-${cap.id}`)}
				onmouseleave={hideTooltip}>
				<span class="dot" class:dot-ready={ready} class:dot-assigned={assigned && !ready} class:dot-empty={!assigned}></span>
				<span class="ready-label">{cap.label}</span>
				{#if tooltipVisible === `ready-${cap.id}`}
					<div class="tooltip">{ready ? `${cap.friendlyName} is active and ready` : assigned ? `${cap.friendlyName} assigned but not loaded yet` : `${cap.friendlyName} needs a model`}</div>
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
			aria-label="Review auto-configuration recommendations">
			<Zap size={16} /> Auto-Configure for {hwTier} tier
		</button>
		{#if tooltipVisible === "auto-all"}
			<div class="tooltip">Shows you exactly what models will be assigned to each capability. You review and approve before anything happens.</div>
		{/if}

		{#if wizardState.recommendations.length > 0}
			<button class="btn-outline-lg"
				onclick={() => { showAutoConfirm = true; }}
				onmouseenter={() => showTooltip("bulk-dl")}
				onmouseleave={hideTooltip}
				aria-label="Review and download recommended models">
				<Download size={16} /> Review Recommendations
			</button>
			{#if tooltipVisible === "bulk-dl"}
				<div class="tooltip">Shows you each recommended model with size, VRAM usage, and download status. You approve before any download starts.</div>
			{/if}
		{/if}
	</div>

	<!-- ── Currently loaded models bar ────────────────── -->
	{#if loadedCaps.length > 0}
		<div class="loaded-bar" aria-live="polite">
			<Check size={14} />
			<span class="loaded-text">
				{loadedCaps.length} active: {loadedCaps.map((c) => c.label).join(", ")}
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
		{@const device = getDevice(cap.id)}
		{@const compatModels = modelsState.models.filter((m) => m.compatible_capabilities.includes(capabilityFilter(cap.id)))}
		{@const autoDetected = compatModels.length > 0 && !model}
		{@const fmt = getPickerFormat(cap.id)}

		<div class="cap-card" class:loaded={isLoaded} class:failed={isFailed}
			style={isLoaded ? `border-color:${cap.color};box-shadow:0 0 1.5rem 0.25rem ${cap.glowColor},inset 0 1px 0 oklch(1 0 0/0.05);` : ""}>
			<!-- Header -->
			<div class="cap-header">
				<div class="cap-icon" style="color:{cap.color}"><Icon size={22} /></div>
				<div class="cap-info">
					<span class="cap-name">{cap.label}</span>
					<span class="cap-desc">{cap.desc}</span>
					{#if rec}
						<span class="cap-rec">Suggested: {rec.name} ({formatMb(rec.sizeMb)}) &mdash; {rec.alreadyDownloaded ? "already on disk" : "download needed"}</span>
					{:else if cap.recNote}
						<span class="cap-rec">Default: {cap.recModel} &mdash; {cap.recNote}</span>
					{/if}
				</div>
				<div class="cap-right">
					<!-- GPU/CPU toggle (#40) -->
					{#if hardwareState.hasGpu}
						<button class="device-toggle" onclick={() => toggleDevice(cap.id)}
							onmouseenter={() => showTooltip(`device-${cap.id}`)}
							onmouseleave={hideTooltip}
							aria-label="Toggle GPU or CPU for {cap.label}"
							aria-pressed={device === "gpu"}>
							{#if device === "gpu"}<Monitor size={14} /> GPU{:else}<Cpu size={14} /> CPU{/if}
						</button>
						{#if tooltipVisible === `device-${cap.id}`}
							<div class="tooltip tooltip-left">{device === "gpu" ? "Running on GPU (fast). Click to switch to CPU." : "Running on CPU (slower but frees GPU VRAM). Click to switch to GPU."}</div>
						{/if}
					{/if}

					<!-- Status badge -->
					{#if isLoaded}<span class="badge badge-ready"><Check size={12} /> Ready</span>
					{:else if status.type === "loading"}<span class="badge badge-loading"><LoaderCircle size={12} class="animate-spin" /> Loading</span>
					{:else if isFailed}<span class="badge badge-failed"><AlertTriangle size={12} /> Failed</span>
					{:else if model}<span class="badge badge-assigned">Assigned</span>
					{:else}<span class="badge badge-empty">Not Set Up</span>{/if}
				</div>
			</div>

			<!-- Auto-detected models notification -->
			{#if autoDetected}
				<div class="detected-bar">
					<Check size={14} />
					<span>Found {compatModels.length} compatible model{compatModels.length > 1 ? "s" : ""} on your disk</span>
					<button class="btn-sm-accent" onclick={() => handleAssign(cap.id, compatModels[0].id)}
						aria-label="Use {compatModels[0].filename} for {cap.label}">
						Use {compatModels[0].filename}
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
							aria-label="View details for {model.filename}">
							{model.filename}
						</button>
						{#if tooltipVisible === `detail-${cap.id}`}
							<div class="tooltip">Click to see full model details — size, architecture, quantization, VRAM usage, and actions</div>
						{/if}

						<span class="format-badge">{modelFormat(model)}</span>

						<button class="btn-icon" onclick={() => confirmDelete(model)}
							onmouseenter={() => showTooltip(`del-${cap.id}`)}
							onmouseleave={hideTooltip}
							aria-label="Delete {model.filename} from disk">
							<Trash2 size={14} />
						</button>
						{#if tooltipVisible === `del-${cap.id}`}
							<div class="tooltip tooltip-left">Delete this model from disk permanently</div>
						{/if}
					</div>

					<div class="model-tags">
						{#if model.quant_level}
							<span class="tag"
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
						<span class="fit-dot" style="background:{fitColor(fit)}"></span>
						<span class="fit-text"
							onmouseenter={() => showTooltip(`fit-${cap.id}`)}
							onmouseleave={hideTooltip}>
							{vramDescription(model.vram_estimate_mb, hardwareState.vramTotalMb)} — {fitLabel(fit)}
						</span>
						{#if tooltipVisible === `fit-${cap.id}`}
							<div class="tooltip">
								{fit === "green" ? "Fits comfortably in your GPU memory. You'll have room for other models too." :
								 fit === "yellow" ? "Tight fit — it'll work but may slow other models sharing the GPU." :
								 fit === "red" ? "Too large for GPU. Will fall back to CPU which is slower but still works." :
								 "Assign a model to check if it fits your hardware."}
							</div>
						{/if}
					</div>

					<!-- Context length editor (#37) -->
					{#if model.context_length > 0}
						{@const ctx = getContextOverride(cap.id, model)}
						<div class="ctx-editor">
							<span class="ctx-label"
								onmouseenter={() => showTooltip(`ctx-${cap.id}`)}
								onmouseleave={hideTooltip}>
								Context: {formatContext(ctx)}
							</span>
							{#if tooltipVisible === `ctx-${cap.id}`}
								<div class="tooltip">{contextDescription(ctx)} — drag the slider to adjust how much conversation the model remembers. More context = more VRAM usage.</div>
							{/if}
							<input type="range" class="ctx-slider"
								min={512} max={model.context_length} step={256}
								value={ctx}
								oninput={(e) => setContextLength(cap.id, Number(e.currentTarget.value))}
								aria-label="Context length for {cap.label}" />
							<span class="ctx-val">{ctx.toLocaleString()} tokens</span>
						</div>
					{/if}
				</div>
			{:else if rec}
				<!-- Recommendation -->
				<div class="rec-box">
					<div class="rec-info">
						<span class="rec-label">Recommended: {rec.name}</span>
						<span class="rec-detail">{formatMb(rec.sizeMb)} &middot; ~{formatMb(rec.vramMb)} VRAM &middot; {rec.device === "cpu" ? "CPU recommended" : "GPU recommended"}</span>
						<!-- Disk space warning (#14) -->
						{#if hardwareState.diskFreeMb && rec.sizeMb > hardwareState.diskFreeMb * 0.9}
							<span class="disk-warn-inline">Low disk space! Need {formatMb(rec.sizeMb)}, only {formatMb(hardwareState.diskFreeMb)} free.</span>
						{/if}
					</div>
					<button class="btn-accent" onclick={() => handleDownload(rec)}
						onmouseenter={() => showTooltip(`dl-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label="Download {rec.name} for {cap.label}">
						<Download size={14} /> Download
					</button>
					{#if tooltipVisible === `dl-${cap.id}`}
						<div class="tooltip">Download {rec.name} from HuggingFace and automatically assign it to {cap.label}</div>
					{/if}
				</div>
			{:else}
				<p class="no-model">No model found for {cap.label}. Assign one below or download from HuggingFace.</p>
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
							aria-label="Cancel download"><X size={14} /> Cancel</button>
					</div>
				</div>
			{/if}

			<!-- Failed state with recovery -->
			{#if isFailed && "error" in status}
				<div class="error-box" aria-live="assertive">
					<AlertTriangle size={14} />
					<span class="error-msg">{status.error}</span>
					<button class="btn-accent" onclick={() => handleLoad(cap.id)}
						aria-label="Retry loading {cap.label}">Retry</button>
					{#if device === "gpu"}
						<button class="btn-outline" onclick={() => { toggleDevice(cap.id); handleLoad(cap.id); }}
							aria-label="Try loading {cap.label} on CPU instead">Try CPU</button>
					{/if}
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
					aria-label={model ? `Change model for ${cap.label}` : `Pick model for ${cap.label}`}>
					{#if isExpanded}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
					{model ? "Change" : "Pick Model"}
				</button>
				{#if tooltipVisible === `pick-${cap.id}`}
					<div class="tooltip">{model ? "Switch to a different model from your disk" : "Browse compatible models on your disk"}</div>
				{/if}

				{#if model && (status.type === "cold" || status.type === "warm" || isFailed)}
					<button class="btn-accent" onclick={() => handleLoadWithGuard(cap.id)}
						onmouseenter={() => showTooltip(`load-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label="Load {cap.friendlyName} into memory">
						<Power size={14} /> Load
					</button>
					{#if tooltipVisible === `load-${cap.id}`}
						<div class="tooltip">Load {cap.friendlyName} into {device === "gpu" ? "GPU" : "CPU"} memory so it's ready to use</div>
					{/if}
				{/if}

				{#if isLoaded}
					<button class="btn-danger" onclick={() => handleUnload(cap.id)}
						onmouseenter={() => showTooltip(`unload-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label="Unload {cap.friendlyName} from memory">
						<PowerOff size={14} /> Unload
					</button>
					{#if tooltipVisible === `unload-${cap.id}`}
						<div class="tooltip">Remove from memory to free up {formatMb(model?.vram_estimate_mb ?? 0)} {device === "gpu" ? "VRAM" : "RAM"}</div>
					{/if}
				{/if}

				{#if cap.configLink}
					<button class="btn-outline"
						onmouseenter={() => showTooltip(`cfg-${cap.id}`)}
						onmouseleave={hideTooltip}
						aria-label="Configure {cap.label} settings">
						<Settings2 size={14} /> Configure
					</button>
					{#if tooltipVisible === `cfg-${cap.id}`}
						<div class="tooltip">Open {cap.label} settings &mdash; language, voice profile, mic test, advanced options</div>
					{/if}
				{/if}

				<button class="btn-icon-sm" onclick={() => onImport(cap.id)}
					onmouseenter={() => showTooltip(`imp-${cap.id}`)}
					onmouseleave={hideTooltip}
					aria-label="Import model file from disk for {cap.label}">
					<FolderOpen size={14} />
				</button>
				{#if tooltipVisible === `imp-${cap.id}`}
					<div class="tooltip">Import a model file from your disk for {cap.label}</div>
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
						<span class="picker-title">Compatible models ({compatModels.length})</span>
						<div class="picker-tabs">
							<button class="picker-tab" class:active={fmt === "all"} onclick={() => setPickerFormat(cap.id, "all")}>All</button>
							<button class="picker-tab" class:active={fmt === "gguf"} onclick={() => setPickerFormat(cap.id, "gguf")}
								onmouseenter={() => showTooltip(`ptab-gguf-${cap.id}`)} onmouseleave={hideTooltip}>
								GGUF
							</button>
							<button class="picker-tab" class:active={fmt === "safetensors"} onclick={() => setPickerFormat(cap.id, "safetensors")}
								onmouseenter={() => showTooltip(`ptab-st-${cap.id}`)} onmouseleave={hideTooltip}>
								SafeTensors
							</button>
							{#if tooltipVisible === `ptab-gguf-${cap.id}`}
								<div class="tooltip">Single file format. Best for local inference. Easy to load/unload.</div>
							{/if}
							{#if tooltipVisible === `ptab-st-${cap.id}`}
								<div class="tooltip">Multi-shard format. Used for larger models. All shards must be present.</div>
							{/if}
						</div>
					</div>

					{#if filteredModels.length === 0}
						<p class="picker-empty">
							{compatModels.length > 0
								? `No ${fmt === "gguf" ? "GGUF" : "SafeTensors"} models on disk. Try a different format tab.`
								: `No compatible models on disk. Download one from HuggingFace below.`}
						</p>
					{/if}

					{#each filteredModels as m (m.id)}
						{@const mFit = calculateFit(m.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0)}
						<button class="picker-row" class:active={model?.id === m.id}
							onclick={() => handleAssign(cap.id, m.id)}
							aria-label="Assign {m.filename} to {cap.label}">
							<span class="picker-name">{m.filename}</span>
							<span class="format-badge-sm">{modelFormat(m)}</span>
							{#if m.quant_level}<span class="tag">{m.quant_level}</span>{/if}
							<span class="tag-muted">{m.architecture}</span>
							<span class="tag-muted">{formatMb(m.size_mb)}</span>
							<span class="tag-muted">{formatMb(m.vram_estimate_mb)} VRAM</span>
							<span class="fit-dot" style="background:{fitColor(mFit)}"></span>
							<span class="fit-text">{fitLabel(mFit)}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/each}

	<!-- Empty state -->
	{#if modelsState.userSlots.length === 0}
		<div class="empty"><p>Waiting for platform to start...</p></div>
	{/if}

	<!-- Summary -->
	<p class="summary">
		{modelsState.models.length} models on disk &middot;
		{CAPABILITIES.filter((c) => modelsState.assignedModel(c.id)).length}/{CAPABILITIES.length} capabilities configured
		{#if hardwareState.diskFreeMb} &middot; {formatMb(hardwareState.diskFreeMb)} disk free{/if}
	</p>

	<!-- HuggingFace search -->
	<hr class="divider" />
	<HuggingFaceSearch
		onDownload={async (repoId, filename, targetSlot) => {
			const rec: ModelRec = { name: filename.replace(/\.gguf$/i, "").replace(/-/g, " "), purpose: "", slot: targetSlot as SlotId, sizeMb: 0, vramMb: 0, repo: repoId, file: filename, device: "any", alreadyDownloaded: false };
			await downloadAndAssign(rec);
		}}
	/>

	<!-- ═══════ OVERLAYS ═══════ -->

	<!-- VRAM warning dialog -->
	{#if showVramWarning && pendingLoadModel}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="dialog-backdrop" onclick={() => { showVramWarning = false; }}>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="dialog" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true"
				onkeydown={(e) => { if (e.key === "Escape") showVramWarning = false; }}>
				<h3 class="dialog-title"><AlertTriangle size={18} /> Model Too Large for GPU</h3>
				<p class="dialog-msg">
					<strong>{pendingLoadModel.filename}</strong> needs ~{formatMb(pendingLoadModel.vram_estimate_mb)} VRAM
					but you only have {formatMb(hardwareState.vramFreeMb ?? 0)} free.<br/><br/>
					It will run on CPU instead. This works but inference is slower.
				</p>
				<div class="dialog-actions">
					<button class="btn-outline" onclick={() => { showVramWarning = false; }}
						aria-label="Cancel loading">Cancel</button>
					<button class="btn-accent" onclick={confirmVramLoad}
						aria-label="Load on CPU anyway">Load on CPU</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Delete confirmation dialog (#46) -->
	{#if showDeleteConfirm && deleteTargetModel}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="dialog-backdrop" onclick={() => { showDeleteConfirm = false; }}>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="dialog" onclick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true"
				onkeydown={(e) => { if (e.key === "Escape") showDeleteConfirm = false; }}>
				<h3 class="dialog-title"><Trash2 size={18} /> Delete Model</h3>
				<p class="dialog-msg">
					Permanently delete <strong>{deleteTargetModel.filename}</strong> ({formatMb(deleteTargetModel.size_mb)}) from disk?<br/><br/>
					This cannot be undone. You'll need to download it again.
				</p>
				<div class="dialog-actions">
					<button class="btn-outline" onclick={() => { showDeleteConfirm = false; }}
						aria-label="Cancel delete">Cancel</button>
					<button class="btn-delete" onclick={executeDelete}
						aria-label="Confirm delete">Delete Permanently</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Model detail overlay (#47) -->
	{#if showDetailOverlay && detailModel}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="dialog-backdrop" onclick={() => { showDetailOverlay = false; }}>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="detail-overlay" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
				onkeydown={(e) => { if (e.key === "Escape") showDetailOverlay = false; }}>
				<div class="detail-header">
					<h3 class="detail-title">{detailModel.filename}</h3>
					<button class="btn-icon" onclick={() => { showDetailOverlay = false; }}
						aria-label="Close detail overlay"><X size={18} /></button>
				</div>

				<div class="detail-grid">
					<div class="detail-row">
						<span class="detail-label">Format</span>
						<span class="detail-value">{modelFormat(detailModel)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Architecture</span>
						<span class="detail-value">{detailModel.architecture}</span>
					</div>
					{#if detailModel.quant_level}
						<div class="detail-row">
							<span class="detail-label">Quantization</span>
							<span class="detail-value">{detailModel.quant_level} &mdash; {quantDescription(detailModel.quant_level)}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">File Size</span>
						<span class="detail-value">{formatMb(detailModel.size_mb)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">VRAM Estimate</span>
						<span class="detail-value">{vramDescription(detailModel.vram_estimate_mb, hardwareState.vramTotalMb)}</span>
					</div>
					{#if detailModel.context_length > 0}
						<div class="detail-row">
							<span class="detail-label">Context Length</span>
							<span class="detail-value">{detailModel.context_length.toLocaleString()} tokens &mdash; {contextDescription(detailModel.context_length)}</span>
						</div>
					{/if}
					<div class="detail-row">
						<span class="detail-label">Hardware Fit</span>
						<span class="detail-value">
							<span class="fit-dot" style="background:{fitColor(calculateFit(detailModel.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0))}"></span>
							{fitLabel(calculateFit(detailModel.vram_estimate_mb, hardwareState.vramFreeMb ?? 0, hardwareState.vramTotalMb ?? 0))}
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Compatible With</span>
						<span class="detail-value">{detailModel.compatible_capabilities.join(", ")}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Model ID</span>
						<span class="detail-value detail-mono">{detailModel.id}</span>
					</div>
				</div>

				<div class="detail-actions">
					<button class="btn-delete" onclick={() => { showDetailOverlay = false; confirmDelete(detailModel!); }}
						aria-label="Delete this model">
						<Trash2 size={14} /> Delete from Disk
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Auto-configure confirmation overlay -->
	{#if showAutoConfirm}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="dialog-backdrop" onclick={() => { showAutoConfirm = false; }}>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="confirm-overlay" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
				onkeydown={(e) => { if (e.key === "Escape") showAutoConfirm = false; }}>
				<h3 class="confirm-title"><Zap size={20} /> Auto-Configure Review</h3>
				<p class="confirm-desc">
					Here's what I recommend for your <strong style="color:oklch(0.65 0.17 185)">{hwTier}</strong> hardware
					({hardwareState.gpuName ?? "CPU"}, {formatMb(hardwareState.vramTotalMb ?? 0)} VRAM).
					Review each item, then approve.
				</p>

				<div class="confirm-list">
					{#each CAPABILITIES as cap (cap.id)}
						{@const rec = wizardState.recommendations.find((r) => r.slot === cap.id)}
						{@const existing = modelsState.assignedModel(cap.id)}
						{@const Icon = cap.icon}
						<div class="confirm-row">
							<div class="confirm-icon" style="color:{cap.color}"><Icon size={18} /></div>
							<div class="confirm-info">
								<span class="confirm-cap">{cap.label}</span>
								{#if existing}
									<span class="confirm-current">Already assigned: {existing.filename}</span>
								{:else if rec}
									<span class="confirm-rec">Will assign: <strong>{rec.name}</strong> ({formatMb(rec.sizeMb)}) — {rec.alreadyDownloaded ? "already on disk" : "needs download"}</span>
								{:else}
									<span class="confirm-none">No recommendation — skip</span>
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
							<span>Will download: <strong>{formatMb(totalDownload)}</strong> ({wizardState.recommendations.length - alreadyHave} models)</span>
						{/if}
						{#if alreadyHave > 0}
							<span>{alreadyHave} model{alreadyHave > 1 ? "s" : ""} already on disk</span>
						{/if}
						{#if hardwareState.diskFreeMb && totalDownload > (hardwareState.diskFreeMb ?? 0) * 0.9}
							<span class="disk-warn-confirm">Warning: Low disk space! Need {formatMb(totalDownload)}, only {formatMb(hardwareState.diskFreeMb)} free.</span>
						{/if}
					</div>
				{/if}

				<div class="confirm-actions">
					<button class="btn-outline" onclick={() => { showAutoConfirm = false; }}
						aria-label="Cancel auto-configure">Cancel</button>
					<button class="btn-accent-lg" onclick={() => { showAutoConfirm = false; autoAssignAllSlots(); }}
						aria-label="Approve and auto-configure">
						<Zap size={16} /> Approve &amp; Configure
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.panel { display:flex;flex-direction:column;gap:1rem;overflow-y:auto;flex:1;padding:0.25rem; }

	/* Hardware bar */
	.hw-bar { display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.875rem;border-radius:0.5rem;background:oklch(0.1 0.02 220/0.6);border:1px solid oklch(0.25 0.02 220/0.3);color:oklch(0.55 0.02 220); }
	.hw-text { flex:1;font-size:0.9375rem; }
	.hw-tier { font-size:0.875rem;font-weight:700;padding:0.125rem 0.5rem;border-radius:0.25rem;background:oklch(0.2 0.04 185/0.3);color:oklch(0.65 0.14 185);text-transform:uppercase; }

	/* Readiness */
	.readiness { display:flex;gap:1rem;align-items:center;flex-wrap:wrap; }
	.ready-item { display:flex;align-items:center;gap:0.375rem;position:relative; }
	.ready-label { font-size:0.9375rem;color:oklch(0.65 0.02 220); }
	.dot { width:0.5rem;height:0.5rem;border-radius:9999px;background:oklch(0.3 0.02 220); }
	.dot-ready { background:oklch(0.72 0.19 152); }
	.dot-assigned { background:oklch(0.75 0.15 75); }
	.dot-empty { background:oklch(0.3 0.02 220); }

	/* Quick actions */
	.quick-actions { display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;position:relative; }

	/* Loaded bar (#20) */
	.loaded-bar { display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:oklch(0.15 0.05 152/0.15);border:1px solid oklch(0.72 0.19 152/0.3);color:oklch(0.72 0.19 152);font-size:0.9375rem; }
	.loaded-text { flex:1; }

	/* Capability card */
	.cap-card { background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;backdrop-filter:blur(12px);transition:border-color 150ms,box-shadow 150ms; }
	.cap-card.loaded { /* color set inline per-capability */ }
	.cap-card.failed { border-color:oklch(0.6 0.22 25);box-shadow:0 0 1rem 0.25rem oklch(0.55 0.2 25/0.35); }

	.cap-header { display:flex;align-items:flex-start;gap:0.75rem; }
	.cap-icon { flex-shrink:0;margin-top:0.125rem; }
	.cap-info { flex:1;min-width:0; }
	.cap-name { display:block;font-size:0.9375rem;font-weight:700;color:oklch(0.93 0.015 224); }
	.cap-desc { display:block;font-size:0.9375rem;color:oklch(0.55 0.02 220);margin-top:0.125rem; }
	.cap-rec { display:block;font-size:0.875rem;color:oklch(0.5 0.08 185);margin-top:0.25rem;font-style:italic; }
	.cap-right { display:flex;align-items:center;gap:0.5rem;flex-shrink:0; }
	.cap-actions { display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;position:relative; }

	/* Device toggle (#40) */
	.device-toggle { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.625rem;border-radius:0.375rem;border:1px solid oklch(0.3 0.03 220/0.4);background:oklch(0.18 0.02 220/0.4);color:oklch(0.7 0.02 220);font-size:0.875rem;font-weight:600;cursor:pointer;position:relative; }
	.device-toggle:hover { background:oklch(0.22 0.02 220/0.4); }

	/* Badges */
	.badge { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.625rem;border-radius:9999px;font-size:0.875rem;font-weight:600; }
	.badge-ready { background:oklch(0.25 0.08 152/0.3);color:oklch(0.72 0.19 152); }
	.badge-loading { background:oklch(0.25 0.08 75/0.3);color:oklch(0.75 0.15 75); }
	.badge-failed { background:oklch(0.25 0.08 25/0.3);color:oklch(0.7 0.18 25); }
	.badge-assigned { background:oklch(0.2 0.04 185/0.3);color:oklch(0.65 0.12 185); }
	.badge-empty { background:oklch(0.2 0.02 220/0.3);color:oklch(0.5 0.02 220); }

	/* Detected bar */
	.detected-bar { display:flex;align-items:center;gap:0.5rem;padding:0.625rem 0.75rem;border-radius:0.5rem;background:oklch(0.15 0.05 152/0.15);border:1px solid oklch(0.72 0.19 152/0.3);color:oklch(0.72 0.19 152);font-size:0.9375rem; }
	.detected-bar span { flex:1; }

	/* Model box */
	.model-box { background:oklch(0.15 0.02 220/0.5);border-radius:0.5rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem; }
	.model-row-main { display:flex;align-items:center;gap:0.5rem;position:relative; }
	.model-name-btn { flex:1;font-size:0.875rem;font-weight:600;color:oklch(0.85 0.12 185);background:none;border:none;cursor:pointer;text-align:left;padding:0;text-decoration:underline;text-decoration-color:oklch(0.65 0.17 185/0.3);text-underline-offset:2px; }
	.model-name-btn:hover { color:oklch(0.65 0.17 185);text-decoration-color:oklch(0.65 0.17 185); }
	.format-badge { font-size:0.6875rem;font-weight:700;padding:0.125rem 0.375rem;border-radius:0.25rem;background:oklch(0.2 0.04 260/0.4);color:oklch(0.7 0.06 260);text-transform:uppercase; }
	.format-badge-sm { font-size:0.625rem;font-weight:700;padding:0.0625rem 0.25rem;border-radius:0.1875rem;background:oklch(0.2 0.04 260/0.4);color:oklch(0.65 0.05 260);text-transform:uppercase; }
	.model-tags { display:flex;flex-wrap:wrap;gap:0.375rem;align-items:center;position:relative; }
	.model-fit { display:flex;align-items:center;gap:0.375rem;position:relative; }
	.fit-dot { width:0.5rem;height:0.5rem;border-radius:9999px;flex-shrink:0; }
	.fit-text { font-size:0.9375rem;color:oklch(0.6 0.02 220);cursor:help; }

	/* Context length editor (#37) */
	.ctx-editor { display:flex;align-items:center;gap:0.5rem;position:relative; }
	.ctx-label { font-size:0.9375rem;color:oklch(0.6 0.02 220);cursor:help;white-space:nowrap; }
	.ctx-slider { flex:1;height:4px;accent-color:oklch(0.65 0.17 185);cursor:pointer; }
	.ctx-val { font-size:0.875rem;color:oklch(0.55 0.02 220);white-space:nowrap;min-width:5rem;text-align:right; }

	/* Tags */
	.tag { font-size:0.875rem;padding:0.125rem 0.5rem;border-radius:0.25rem;background:oklch(0.2 0.02 220/0.6);color:oklch(0.8 0.02 220);cursor:help;position:relative; }
	.tag-muted { font-size:0.9375rem;color:oklch(0.6 0.02 220); }

	/* Recommendation */
	.rec-box { display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.5rem;border:1px dashed oklch(0.35 0.06 185/0.4);background:oklch(0.12 0.025 185/0.1);position:relative; }
	.rec-info { flex:1; }
	.rec-label { display:block;font-size:0.875rem;font-weight:600;color:oklch(0.85 0.015 224); }
	.rec-detail { display:block;font-size:0.875rem;color:oklch(0.55 0.02 220); }
	.disk-warn-inline { display:block;font-size:0.875rem;color:oklch(0.8 0.12 25);margin-top:0.25rem; }
	.no-model { font-size:0.875rem;color:oklch(0.45 0.02 220);font-style:italic;margin:0; }

	/* Download */
	.dl-bar { background:oklch(0.15 0.02 220/0.5);border-radius:0.5rem;padding:0.75rem; }
	.dl-stats { display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;font-size:0.9375rem;color:oklch(0.6 0.02 220); }

	/* Error */
	.error-box { display:flex;align-items:center;gap:0.5rem;padding:0.75rem;border-radius:0.5rem;background:oklch(0.2 0.08 25/0.25);border:1px solid oklch(0.6 0.22 25/0.4);color:oklch(0.8 0.12 25);font-size:0.9375rem; }
	.error-msg { flex:1; }

	/* Loading */
	.loading-row { display:flex;align-items:center;gap:0.5rem;font-size:0.9375rem;color:oklch(0.6 0.02 220); }

	/* Picker */
	.picker { background:oklch(0.15 0.02 220/0.5);border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.5rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.25rem;animation:expand 150ms ease-out; }
	.picker-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;flex-wrap:wrap;gap:0.375rem; }
	.picker-title { font-size:0.9375rem;font-weight:700;color:oklch(0.7 0.02 220); }
	.picker-tabs { display:flex;gap:0.125rem;background:oklch(0.1 0.015 220/0.4);border-radius:0.375rem;padding:0.125rem;position:relative; }
	.picker-tab { padding:0.25rem 0.625rem;border-radius:0.25rem;border:none;background:transparent;color:oklch(0.55 0.02 220);font-size:0.875rem;font-weight:600;cursor:pointer; }
	.picker-tab.active { background:oklch(0.2 0.03 185/0.3);color:oklch(0.65 0.17 185); }
	.picker-empty { font-size:0.9375rem;color:oklch(0.45 0.02 220);margin:0; }
	.picker-row { display:flex;align-items:center;gap:0.5rem;width:100%;padding:0.5rem;border-radius:0.375rem;border:none;background:transparent;cursor:pointer;font-size:0.9375rem;color:oklch(0.85 0.015 224);text-align:left; }
	.picker-row:hover { background:oklch(0.2 0.015 220/0.5); }
	.picker-row.active { outline:2px solid oklch(0.65 0.17 185);outline-offset:-2px; }
	.picker-name { flex:1;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }

	/* Tooltip */
	.tooltip { position:absolute;z-index:40;bottom:calc(100% + 0.5rem);left:50%;transform:translateX(-50%);white-space:normal;max-width:20rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:oklch(0.08 0.02 220);border:1px solid oklch(0.3 0.03 220/0.5);color:oklch(0.8 0.015 224);font-size:0.875rem;line-height:1.4;box-shadow:0 4px 12px oklch(0 0 0/0.4);pointer-events:none;animation:fade-in 100ms ease-out; }
	.tooltip-left { left:auto;right:0;transform:none; }

	/* Buttons */
	.btn-accent { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.9375rem;font-weight:700;cursor:pointer;transition:filter 100ms; }
	.btn-accent:hover { filter:brightness(1.15); }
	.btn-accent-lg { display:inline-flex;align-items:center;gap:0.5rem;padding:0.625rem 1.5rem;border-radius:0.625rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.9375rem;font-weight:800;cursor:pointer;box-shadow:0 0 1.25rem oklch(0.65 0.17 185/0.3); }
	.btn-accent-lg:hover { filter:brightness(1.15);box-shadow:0 0 2rem oklch(0.65 0.17 185/0.5); }
	.btn-outline { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:1px solid oklch(0.3 0.03 220/0.5);background:transparent;color:oklch(0.75 0.02 220);font-size:0.9375rem;cursor:pointer; }
	.btn-outline:hover { background:oklch(0.18 0.015 220/0.3); }
	.btn-outline-lg { display:inline-flex;align-items:center;gap:0.5rem;padding:0.625rem 1.5rem;border-radius:0.625rem;border:1px solid oklch(0.3 0.03 220/0.5);background:transparent;color:oklch(0.75 0.02 220);font-size:0.9375rem;cursor:pointer; }
	.btn-danger { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:1px solid oklch(0.5 0.15 25/0.4);background:transparent;color:oklch(0.7 0.15 25);font-size:0.9375rem;cursor:pointer; }
	.btn-cancel { display:inline-flex;align-items:center;gap:0.25rem;padding:0.25rem 0.5rem;border:none;background:transparent;color:oklch(0.65 0.15 25);font-size:0.9375rem;cursor:pointer; }
	.btn-icon { background:none;border:none;color:oklch(0.45 0.02 220);cursor:pointer;padding:0.25rem;position:relative; }
	.btn-icon:hover { color:oklch(0.7 0.15 25); }
	.btn-icon-sm { background:none;border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.375rem;color:oklch(0.55 0.02 220);cursor:pointer;padding:0.375rem;position:relative; }
	.btn-icon-sm:hover { background:oklch(0.18 0.015 220/0.3); }
	.btn-sm-accent { padding:0.25rem 0.625rem;border-radius:0.375rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.875rem;font-weight:700;cursor:pointer; }
	.btn-delete { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:none;background:oklch(0.55 0.2 25);color:oklch(0.97 0.02 60);font-size:0.9375rem;font-weight:700;cursor:pointer; }
	.btn-delete:hover { filter:brightness(1.1); }

	/* Dialog */
	.dialog-backdrop { position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:oklch(0 0 0/0.6); }
	.dialog { width:100%;max-width:28rem;margin:1rem;padding:1.5rem;background:oklch(0.1 0.02 220);border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.75rem; }
	.dialog-title { display:flex;align-items:center;gap:0.5rem;font-size:1.125rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0 0 0.5rem; }
	.dialog-msg { font-size:0.875rem;color:oklch(0.65 0.02 220);margin:0 0 1.5rem;line-height:1.5; }
	.dialog-msg strong { color:oklch(0.9 0.015 224); }
	.dialog-actions { display:flex;justify-content:flex-end;gap:0.75rem; }

	/* Detail overlay (#47) */
	.detail-overlay { width:100%;max-width:32rem;margin:1rem;padding:1.5rem;background:oklch(0.1 0.02 220);border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.75rem;max-height:80vh;overflow-y:auto; }
	.detail-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem; }
	.detail-title { font-size:1.125rem;font-weight:700;color:oklch(0.93 0.015 224);margin:0;word-break:break-all; }
	.detail-grid { display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem; }
	.detail-row { display:flex;gap:0.75rem;padding:0.5rem 0;border-bottom:1px solid oklch(0.2 0.02 220/0.3); }
	.detail-label { width:8rem;flex-shrink:0;font-size:0.9375rem;font-weight:600;color:oklch(0.6 0.02 220); }
	.detail-value { flex:1;font-size:0.875rem;color:oklch(0.85 0.015 224);display:flex;align-items:center;gap:0.375rem; }
	.detail-mono { font-family:monospace;font-size:0.9375rem;color:oklch(0.6 0.02 220);word-break:break-all; }
	.detail-actions { display:flex;justify-content:flex-end;gap:0.75rem; }

	/* Misc */
	.divider { border:none;border-top:1px solid oklch(0.25 0.02 220/0.5);margin:0.5rem 0; }
	.summary { text-align:center;font-size:0.9375rem;color:oklch(0.45 0.02 220);margin:0; }
	.empty { text-align:center;padding:3rem 0;color:oklch(0.5 0.02 220); }

	@keyframes expand { from{opacity:0;transform:translateY(-0.5rem)} to{opacity:1;transform:translateY(0)} }
	/* Auto-configure confirmation overlay */
	.confirm-overlay { width:100%;max-width:36rem;margin:1rem;padding:1.5rem;background:oklch(0.1 0.02 220);border:1px solid oklch(0.3 0.02 220/0.4);border-radius:0.75rem;max-height:85vh;overflow-y:auto; }
	.confirm-title { display:flex;align-items:center;gap:0.5rem;font-size:1.25rem;font-weight:800;color:oklch(0.93 0.015 224);margin:0 0 0.5rem; }
	.confirm-desc { font-size:1rem;color:oklch(0.65 0.02 220);margin:0 0 1rem;line-height:1.5; }
	.confirm-desc strong { color:oklch(0.93 0.015 224); }
	.confirm-list { display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem; }
	.confirm-row { display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:0.5rem;background:oklch(0.13 0.025 220/0.6);border:1px solid oklch(0.25 0.02 220/0.3); }
	.confirm-icon { flex-shrink:0; }
	.confirm-info { flex:1; }
	.confirm-cap { display:block;font-size:1rem;font-weight:700;color:oklch(0.93 0.015 224); }
	.confirm-current { display:block;font-size:0.9375rem;color:oklch(0.66 0.17 155); }
	.confirm-rec { display:block;font-size:0.9375rem;color:oklch(0.82 0.14 195); }
	.confirm-rec strong { color:oklch(0.93 0.015 224); }
	.confirm-none { display:block;font-size:0.9375rem;color:oklch(0.5 0.02 220);font-style:italic; }
	.confirm-summary { display:flex;flex-direction:column;gap:0.25rem;padding:0.75rem;border-radius:0.5rem;background:oklch(0.12 0.02 220/0.4);margin-bottom:1rem;font-size:0.9375rem;color:oklch(0.7 0.02 220); }
	.confirm-summary strong { color:oklch(0.93 0.015 224); }
	.disk-warn-confirm { color:oklch(0.8 0.12 25);font-weight:600; }
	.confirm-actions { display:flex;justify-content:flex-end;gap:0.75rem; }

	@keyframes expand { from{opacity:0;transform:translateY(-0.5rem)} to{opacity:1;transform:translateY(0)} }
	@keyframes fade-in { from{opacity:0} to{opacity:1} }
</style>

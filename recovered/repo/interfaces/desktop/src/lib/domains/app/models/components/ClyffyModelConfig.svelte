<!--
  @file ClyffyModelConfig — DevTool panel for model configuration.
  Shows every slot, download/load status, one-click actions.
  This is the REAL model loader — not a wizard, not cosmetic.
  ALL styling via renderForge + cssVarString.
-->
<script lang="ts">
import { Download, FolderOpen, Loader2, Play, Power, PowerOff, Search, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import {
	downloadModel,
	importLocalModel,
	onDownloadProgress,
} from "../services/download.service.js";
import { formatMb } from "../types/models.types.js";
import ClyffyNarration from "./ClyffyNarration.svelte";
import ModelSearch from "./ModelSearch.svelte";
import VramGauge from "./VramGauge.svelte";

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

let showSearch = $state(false);
let error = $state<string | null>(null);
let downloading = $state<Record<string, number>>({});
let health = $state<{ name: string; status: string; latency_us: number | null }[]>([]);

// ── Baseline Models — exact HF repos ──────────────────────────

interface ModelOption {
	label: string;
	repo: string;
	file: string;
	sizeMb: number;
	isDir?: boolean;
}

interface SlotConfig {
	label: string;
	description: string;
	options: ModelOption[];
}

const SLOTS: Record<string, SlotConfig> = {
	"chat.brain": {
		label: "Clyffy's Brain",
		description: "Main reasoning model for chat",
		options: [
			{
				label: "4B (Fast)",
				repo: "bartowski/Qwen3-4B-GGUF",
				file: "Qwen3-4B-Q4_K_M.gguf",
				sizeMb: 2600,
			},
			{
				label: "7B (Balanced)",
				repo: "bartowski/Qwen3-7B-GGUF",
				file: "Qwen3-7B-Q4_K_M.gguf",
				sizeMb: 4100,
			},
			{
				label: "14B (Smart)",
				repo: "bartowski/Qwen3-14B-GGUF",
				file: "Qwen3-14B-Q4_K_M.gguf",
				sizeMb: 8100,
			},
		],
	},
	"minion.shared": {
		label: "Minion Brain",
		description: "Fast background tasks",
		options: [
			{ label: "0.6B", repo: "Qwen/Qwen3-0.6B-GGUF", file: "qwen3-0.6b-q4_k_m.gguf", sizeMb: 500 },
		],
	},
	"voice.stt": {
		label: "Voice \u2014 Speech Recognition (STT)",
		description: "Whisper speech-to-text",
		options: [
			{
				label: "Whisper Large v3 Turbo",
				repo: "csukuangfj/sherpa-onnx-whisper-large-v3-turbo",
				file: "large-v3-turbo-encoder.int8.onnx",
				sizeMb: 1600,
				isDir: true,
			},
		],
	},
	"voice.tts": {
		label: "Voice \u2014 Text to Speech (TTS)",
		description: "Kokoro voice synthesis",
		options: [
			{
				label: "Kokoro v1.0 fp16",
				repo: "onnx-community/Kokoro-82M-v1.0-ONNX",
				file: "model_fp16.onnx",
				sizeMb: 163,
			},
		],
	},
	"vision.embedder": {
		label: "Vision \u2014 Screen Analysis",
		description: "SigLIP2 screenshot understanding",
		options: [
			{
				label: "SigLIP2 Base int8",
				repo: "onnx-community/siglip2-base-patch16-256-ONNX",
				file: "vision_model_int8.onnx",
				sizeMb: 95,
			},
		],
	},
	"rag.embedder": {
		label: "Search \u2014 Embedder",
		description: "Vector search for code and docs",
		options: [
			{
				label: "nomic-embed-v1.5",
				repo: "nomic-ai/nomic-embed-text-v1.5-GGUF",
				file: "nomic-embed-text-v1.5.Q8_0.gguf",
				sizeMb: 300,
			},
		],
	},
	"rag.reranker": {
		label: "Search \u2014 Reranker",
		description: "Relevance scoring for search results",
		options: [
			{
				label: "Qwen3-Reranker-0.6B",
				repo: "Qwen/Qwen3-Reranker-0.6B-GGUF",
				file: "qwen3-reranker-0.6b.Q8_0.gguf",
				sizeMb: 300,
			},
		],
	},
};

const slotOrder = [
	"chat.brain",
	"minion.shared",
	"voice.stt",
	"voice.tts",
	"vision.embedder",
	"rag.embedder",
	"rag.reranker",
];

// ── Selected size per multi-option slot ───────────────────────

let selectedOption = $state<Record<string, number>>({
	"chat.brain": 0,
});

const m = $derived(renderForge({ kind: "model-config", preset: "primary" }));

// ── Init ──────────────────────────────────────────────────────

$effect(() => {
	hardwareState.startListening();
	modelsState.refresh();
	modelsState.startStatusListener();
	loadHealth();
	return () => {
		hardwareState.stopListening();
		modelsState.stopStatusListener();
	};
});

async function loadHealth(): Promise<void> {
	try {
		const result = await commands.getStatus();
		if (result.status === "ok" && result.data.subsystems) {
			health = result.data.subsystems.map((s) => ({
				name: s.name,
				status: s.status,
				latency_us: s.latency_us,
			}));
		}
	} catch (e) {
		console.warn("[ClyffyModelConfig] Health check failed:", e);
	}
}

// ── Slot Status Helpers ───────────────────────────────────────

function slotStatus(
	slotId: string,
): "not_downloaded" | "downloaded" | "loading" | "loaded" | "error" {
	const status = modelsState.statuses[slotId];
	if (!status) {
		const slot = modelsState.slots.find((s) => s.id === slotId);
		if (slot?.assigned_model_id) return "downloaded";
		return "not_downloaded";
	}
	return status.type === "not_loaded"
		? "downloaded"
		: (status.type as "loading" | "loaded" | "error");
}

function statusBadge(status: string): {
	label: string;
	variant: "positive" | "negative" | "neutral";
} {
	switch (status) {
		case "loaded":
			return { label: "Loaded", variant: "positive" };
		case "loading":
			return { label: "Loading...", variant: "neutral" };
		case "downloaded":
			return { label: "Ready", variant: "neutral" };
		case "error":
			return { label: "Error", variant: "negative" };
		default:
			return { label: "Not Downloaded", variant: "neutral" };
	}
}

// ── Actions ───────────────────────────────────────────────────

async function handleDownload(slotId: string): Promise<void> {
	const config = SLOTS[slotId];
	if (!config) return;
	const optIdx = selectedOption[slotId] ?? 0;
	const opt = config.options[optIdx];
	error = null;

	const unsubProgress = onDownloadProgress((p) => {
		if (p.totalBytes > 0) {
			downloading[slotId] = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		}
	});

	try {
		downloading[slotId] = 0;
		await downloadModel(opt.repo, opt.file);
		downloading[slotId] = 100;
		await modelsState.scan();
		await modelsState.refresh();
		delete downloading[slotId];
	} catch (e) {
		delete downloading[slotId];
		error = `Download failed for ${config.label}: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		unsubProgress();
	}
}

async function handleLoad(slotId: string): Promise<void> {
	error = null;
	try {
		await modelsState.load(slotId);
	} catch (e) {
		error = `Load failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleUnload(slotId: string): Promise<void> {
	error = null;
	try {
		await modelsState.unload(slotId);
	} catch (e) {
		error = `Unload failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleImport(): Promise<void> {
	error = null;
	try {
		await importLocalModel();
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		error = `Import failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleSearchDownload(repoId: string, filename: string): Promise<void> {
	error = null;
	try {
		await downloadModel(repoId, filename);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleApplyAndLaunch(): Promise<void> {
	error = null;
	try {
		const result = await commands.completeModelSetup();
		if (result.status === "error") {
			error = result.error;
		} else {
			onComplete?.();
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}
</script>

<div
	style={cssVarString(m.cssVars)}
	class={`${stack({ gap: "4" })} w-full`}
	data-component="clyffy-model-config"
>
	<!-- Header -->
	<div class={hstack({ justify: "between", align: "center" })}>
		<div class={hstack({ gap: "2", align: "center" })}>
			<Text size="lg" weight="bold" color="primary">Clyffy Model Configuration</Text>
			<Badge variant="neutral" size="sm">DevTool</Badge>
		</div>
		<VramGauge
			usedMb={hardwareState.vramUsedMb}
			totalMb={hardwareState.vramTotalMb}
			hasGpu={hardwareState.hasGpu}
			gpuError={hardwareState.gpuError}
			label={hardwareState.hasGpu ? hardwareState.metrics?.gpu_name ?? "GPU" : "CPU Mode"}
		/>
	</div>

	<!-- Slot Rows -->
	{#each slotOrder as slotId (slotId)}
		{@const config = SLOTS[slotId]}
		{@const status = slotStatus(slotId)}
		{@const badge = statusBadge(status)}
		{@const optIdx = selectedOption[slotId] ?? 0}
		{@const opt = config.options[optIdx]}
		{@const isDownloading = slotId in downloading}
		{@const isLoaded = status === "loaded"}
		{@const hasModel = status !== "not_downloaded"}

		<div
			class="rounded-lg border px-4 py-3 transition-colors"
			style="border-color: var(--border-subtle); background: var(--surface-base);"
		>
			<div class={hstack({ justify: "between", align: "start" })}>
				<!-- Left: label + description -->
				<div class={stack({ gap: "1" })}>
					<div class={hstack({ gap: "2", align: "center" })}>
						<Text size="sm" weight="bold" color="primary">{config.label}</Text>
						<Badge variant={badge.variant} size="sm">{badge.label}</Badge>
					</div>
					<Text size="xs" color="muted">{config.description}</Text>
				</div>

				<!-- Right: actions -->
				<div class={hstack({ gap: "2", align: "center" })}>
					{#if isDownloading}
						<div class={hstack({ gap: "1", align: "center" })}>
							<Loader2 size={14} class="animate-spin" style="color: var(--accent-teal-main);" />
							<Text size="xs" color="muted">Downloading {downloading[slotId] ?? 0}%</Text>
						</div>
					{:else if !hasModel}
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => handleDownload(slotId)}
						>
							<Download size={12} />
							Download ({formatMb(opt.sizeMb)})
						</button>
					{:else if isLoaded}
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
							onclick={() => handleUnload(slotId)}
						>
							<PowerOff size={12} />
							Unload
						</button>
					{:else}
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => handleLoad(slotId)}
						>
							<Power size={12} />
							Load
						</button>
					{/if}
				</div>
			</div>

			<!-- Size selector (for multi-option slots like chat.brain) -->
			{#if config.options.length > 1}
				<div class="mt-2 flex gap-2">
					{#each config.options as opt, i (opt.label)}
						<button
							class="rounded px-3 py-1 text-xs font-medium transition-all"
							style={selectedOption[slotId] === i
								? "background: var(--accent-teal-main); color: var(--surface-base);"
								: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"}
							onclick={() => { selectedOption[slotId] = i; }}
						>
							{opt.label} ({formatMb(opt.sizeMb)})
						</button>
					{/each}
				</div>
			{/if}

			<!-- Model file info -->
			<div class="mt-1">
				<Text size="xs" color="muted">{opt.file}</Text>
			</div>
		</div>
	{/each}

	<!-- Platform Status Bar -->
	{#if health.length > 0}
		<div class="rounded-lg border px-4 py-3" style="border-color: var(--border-subtle); background: var(--surface-base);">
			<Text size="xs" weight="bold" color="secondary" class="mb-2">Platform Status</Text>
			<div class="flex flex-wrap gap-3">
				{#each health as svc (svc.name)}
					<div class={hstack({ gap: "1", align: "center" })}>
						<div
							class="h-2 w-2 rounded-full"
							style="background: {svc.status === 'Healthy' ? 'var(--signal-success)' : svc.status === 'Down' ? 'var(--signal-error)' : 'var(--text-muted)'};"
						></div>
						<Text size="xs" color="muted">
							{svc.name}
							{#if svc.latency_us !== null}
								<span class="opacity-50">({Math.round(svc.latency_us / 1000)}ms)</span>
							{/if}
						</Text>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Error display -->
	{#if error}
		<ClyffyNarration message={error} type="error" />
	{/if}

	<!-- Bottom Actions -->
	<div class="flex flex-wrap items-center justify-center gap-3">
		<button
			class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:brightness-110"
			style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
			onclick={handleImport}
		>
			<FolderOpen size={14} />
			Import from Disk
		</button>

		<button
			class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:brightness-110"
			style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
			onclick={() => (showSearch = !showSearch)}
		>
			<Search size={14} />
			{showSearch ? "Hide Search" : "Search HuggingFace"}
		</button>

		<button
			class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all hover:brightness-125"
			style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 0.75rem var(--accent-teal-glow);"
			onclick={handleApplyAndLaunch}
		>
			<Zap size={16} />
			Apply and Launch Clyffy
		</button>
	</div>

	<!-- Inline HF Search -->
	{#if showSearch}
		<ModelSearch onDownload={handleSearchDownload} onClose={() => (showSearch = false)} />
	{/if}
</div>

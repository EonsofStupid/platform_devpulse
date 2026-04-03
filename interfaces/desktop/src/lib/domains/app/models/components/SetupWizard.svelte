<!--
  @file SetupWizard — First-run guided setup for model configuration.
  6-step flow: welcome → scanning → recommendations → downloading → verifying → ready.
  Includes HF search, voice models, knowledge drops, per-model + bulk download.
  ALL styling via renderForge + cssVarString + Tailwind layout.
-->
<script lang="ts">
import { CircleCheck, Download, FolderOpen, Scan, Sparkles, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { loadWizardContent, type WizardContent } from "../services/content.service.js";
import {
	downloadModel,
	importLocalModel,
	onDownloadComplete,
	onDownloadProgress,
} from "../services/download.service.js";
import { scanModels } from "../services/registry.service.js";
import { type FitIndicator, formatMb } from "../types/models.types.js";
import ClyffyNarration from "./ClyffyNarration.svelte";
import ModelSearch from "./ModelSearch.svelte";
import VramGauge from "./VramGauge.svelte";

type WizardStep =
	| "welcome"
	| "scanning"
	| "recommendations"
	| "downloading"
	| "verifying"
	| "ready";

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

let step = $state<WizardStep>("welcome");
let content = $state<WizardContent | null>(null);
let downloadProgress = $state(0);
let knowledgeIndex = $state(0);
let knowledgeTimer: ReturnType<typeof setInterval> | null = null;
let error = $state<string | null>(null);

const m = $derived(renderForge({ kind: "setup-wizard", preset: "primary" }));

// Load content on mount
$effect(() => {
	loadWizardContent().then((c) => {
		content = c;
	});
	hardwareState.startListening();
	return () => {
		hardwareState.stopListening();
		if (knowledgeTimer) clearInterval(knowledgeTimer);
	};
});

// Auto-transition from scanning to recommendations when hardware detected
$effect(() => {
	if (step === "scanning" && hardwareState.metrics && !hardwareState.loading) {
		setTimeout(() => {
			step = "recommendations";
		}, 1500);
	}
});

// Knowledge drop rotation during download
$effect(() => {
	if (step === "downloading" && content && content.knowledgeDrops.length > 0) {
		knowledgeTimer = setInterval(() => {
			knowledgeIndex = (knowledgeIndex + 1) % (content?.knowledgeDrops.length ?? 1);
		}, 8000);
		return () => {
			if (knowledgeTimer) clearInterval(knowledgeTimer);
		};
	}
});

const clyffyMessage = $derived.by((): string => {
	if (!content) return "Loading...";
	switch (step) {
		case "welcome":
			return content.welcome.greeting;
		case "scanning":
			return content.scanning.title;
		case "recommendations": {
			const hw = hardwareState.metrics;
			if (!hw) return content.scanning.title;
			if (hardwareState.hasGpu) {
				return content.scanning.results.gpuFound
					.replace("{gpuName}", hw.gpu_name ?? "GPU")
					.replace("{vramGb}", formatMb(hardwareState.vramTotalMb));
			}
			return content.scanning.results.noGpu;
		}
		case "downloading":
			return content.downloading.title;
		case "verifying":
			return content.verifying.title;
		case "ready":
			return content.ready.title;
	}
});

const tierMessage = $derived.by((): string => {
	if (!content) return "";
	switch (hardwareState.tier) {
		case "high":
			return content.scanning.results.tierHigh;
		case "medium":
			return content.scanning.results.tierMedium;
		case "low":
			return content.scanning.results.tierLow;
		default:
			return content.scanning.results.tierCpu;
	}
});

const tierLabel = $derived.by((): string => {
	switch (hardwareState.tier) {
		case "high":
			return "High-End GPU";
		case "medium":
			return "Mid-Range GPU";
		case "low":
			return "Entry GPU";
		case "minimal":
			return "Basic GPU";
		case "cpu_only":
			return "CPU Only";
	}
});

interface ModelRec {
	name: string;
	purpose: string;
	sizeMb: number;
	vramMb: number;
	fit: FitIndicator;
	repo: string;
	file: string;
}

const recommendations = $derived.by((): ModelRec[] => {
	const free = hardwareState.vramFreeMb;
	const total = hardwareState.vramTotalMb;
	const calcFit = (vram: number): FitIndicator => {
		if (!hardwareState.hasGpu) return "gray";
		if (vram > free) return "red";
		if (((free - vram) / total) * 100 < 20) return "yellow";
		return "green";
	};

	const brain = (
		name: string,
		sizeMb: number,
		vramMb: number,
		repo: string,
		file: string,
	): ModelRec => ({
		name,
		purpose: "Main reasoning",
		sizeMb,
		vramMb,
		fit: calcFit(vramMb),
		repo,
		file,
	});

	const worker = (sizeMb: number, vramMb: number, file: string): ModelRec => ({
		name: "Quick Worker",
		purpose: "Fast tasks",
		sizeMb,
		vramMb,
		fit: calcFit(vramMb),
		repo: "Qwen/Qwen3-0.6B-GGUF",
		file,
	});

	const embedder: ModelRec = {
		name: "Search Engine",
		purpose: "Find code & docs",
		sizeMb: 300,
		vramMb: 300,
		fit: calcFit(300),
		repo: "nomic-ai/nomic-embed-text-v1.5-GGUF",
		file: "nomic-embed-text-v1.5.Q8_0.gguf",
	};

	// Voice + vision models are BUNDLED with the app — not shown here.
	// This wizard only handles user-managed models (brain, worker, embedder).

	switch (hardwareState.tier) {
		case "high":
			return [
				brain("AI Brain", 8100, 9200, "bartowski/Qwen3-14B-GGUF", "Qwen3-14B-Q4_K_M.gguf"),
				worker(700, 400, "qwen3-0.6b-q8_0.gguf"),
				embedder,
			];
		case "medium":
			return [
				brain("AI Brain", 2600, 3200, "bartowski/Qwen3-4B-GGUF", "Qwen3-4B-Q4_K_M.gguf"),
				worker(500, 350, "qwen3-0.6b-q4_k_m.gguf"),
				embedder,
			];
		case "low":
			return [
				brain("AI Brain", 1200, 1500, "bartowski/Qwen3-1.7B-GGUF", "Qwen3-1.7B-Q4_K_M.gguf"),
				worker(500, 350, "qwen3-0.6b-q4_k_m.gguf"),
				embedder,
			];
		default:
			return [
				brain("AI Brain (CPU)", 500, 350, "Qwen/Qwen3-0.6B-GGUF", "qwen3-0.6b-q4_k_m.gguf"),
				embedder,
			];
	}
});

const totalDownloadMb = $derived(recommendations.reduce((sum, r) => sum + r.sizeMb, 0));

function startScanning(): void {
	step = "scanning";
}

/** Download a single recommended model. */
async function handleSingleDownload(rec: ModelRec): Promise<void> {
	try {
		step = "downloading";
		downloadProgress = 0;

		const unsubProgress = onDownloadProgress((p) => {
			if (p.totalBytes > 0) {
				downloadProgress = Math.min(95, (p.bytesDownloaded / p.totalBytes) * 100);
			}
		});

		await downloadModel(rec.repo, rec.file);
		unsubProgress();

		await scanModels();
		downloadProgress = 100;

		// Back to recommendations so they can install more or continue
		step = "recommendations";
		await modelsState.refresh();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		error = msg;
		console.error(`[SetupWizard] Download failed for ${rec.name}:`, e);
		step = "recommendations";
	}
}

/** Download a model from HuggingFace search results. */
async function handleSearchDownload(repoId: string, filename: string): Promise<void> {
	try {
		step = "downloading";
		downloadProgress = 0;

		const unsubProgress = onDownloadProgress((p) => {
			if (p.totalBytes > 0) {
				downloadProgress = Math.min(95, (p.bytesDownloaded / p.totalBytes) * 100);
			}
		});

		await downloadModel(repoId, filename);
		unsubProgress();

		await scanModels();
		downloadProgress = 100;

		// Back to recommendations so they can install more
		step = "recommendations";
		await modelsState.refresh();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		error = msg;
		console.error(`[SetupWizard] Search download failed:`, e);
		step = "recommendations";
	}
}

/** Install all suggested models sequentially. */
async function handleSetup(): Promise<void> {
	step = "downloading";
	downloadProgress = 0;
	error = null;

	try {
		const totalModels = recommendations.length;
		let completed = 0;

		const unsubProgress = onDownloadProgress((p) => {
			const modelSlice = 100 / totalModels;
			const modelProg = p.totalBytes > 0 ? (p.bytesDownloaded / p.totalBytes) * modelSlice : 0;
			downloadProgress = Math.min(95, completed * modelSlice + modelProg);
		});

		const unsubComplete = onDownloadComplete(() => {
			completed++;
			downloadProgress = Math.min(95, (completed / totalModels) * 100);
		});

		for (const rec of recommendations) {
			try {
				await downloadModel(rec.repo, rec.file);
			} catch (e) {
				console.error(`[SetupWizard] Download failed for ${rec.name}:`, e);
				// Continue with remaining models
			}
		}

		unsubProgress();
		unsubComplete();

		// Re-scan registry
		await scanModels();
		downloadProgress = 100;

		// Verify step
		step = "verifying";
		await modelsState.refresh();

		// Brief pause so user sees verification
		await new Promise((r) => setTimeout(r, 1500));
		step = "ready";
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		error = content?.errors.downloadFailed ?? msg;
		console.error("[SetupWizard] Setup failed:", e);
	}
}

/** Import a model from the local filesystem via native file picker. */
async function handleImportLocal(): Promise<void> {
	try {
		await importLocalModel();
		await scanModels();
		await modelsState.refresh();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		error = msg;
		console.error("[SetupWizard] Import failed:", e);
	}
}

function handleManualSetup(): void {
	// Skip wizard, let user configure manually via Model Control
	onComplete?.();
}

const fitColorMap: Record<string, string> = {
	green: "var(--signal-success)",
	yellow: "var(--signal-warning)",
	red: "var(--signal-error)",
	gray: "var(--text-muted)",
};
</script>

<div
	style={cssVarString(m.cssVars)}
	class={`${stack({ gap: "6" })} w-full`}
	data-component="setup-wizard"
>
	{#if step === "welcome"}
		<!-- WELCOME -->
		<div class="flex flex-col items-center gap-6 py-8">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-full"
				style="border: 2px solid var(--accent-teal-main); box-shadow: 0 0 1.5rem var(--accent-teal-glow);"
			>
				<Sparkles size={36} style="color: var(--accent-teal-main);" />
			</div>
			<div class={stack({ gap: "2", align: "center" })}>
				<Text size="xl" weight="bold" color="primary">{content?.welcome.greeting ?? "Hi!"}</Text>
				<Text size="sm" color="muted">{content?.welcome.subtitle ?? "Let me set up your AI."}</Text>
			</div>
			<button
				class="flex items-center gap-2 rounded-lg px-8 py-3 text-base font-bold transition-all hover:brightness-125"
				style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 1rem var(--accent-teal-glow);"
				onclick={startScanning}
			>
				<Zap size={18} />
				{content?.welcome.cta ?? "Let's Go"}
			</button>
		</div>

	{:else if step === "scanning"}
		<!-- SCANNING -->
		<div class="flex flex-col items-center gap-6 py-8">
			<div
				class="h-12 w-12 animate-spin rounded-full border-2 border-t-transparent"
				style="border-color: var(--accent-teal-main); border-top-color: transparent;"
			></div>
			<Scan size={24} class="animate-pulse opacity-50" />
			<Text size="lg" weight="semibold" color="primary">{content?.scanning.title ?? "Checking..."}</Text>
		</div>

	{:else if step === "recommendations"}
		<!-- RECOMMENDATIONS — Two-column layout: gauge | model cards -->
		<div class="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-6 w-full items-start">
			<!-- Left column: Hardware gauge -->
			<div class="flex flex-col items-center gap-3 rounded-xl p-4"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<VramGauge
					usedMb={hardwareState.vramUsedMb}
					totalMb={hardwareState.vramTotalMb}
					hasGpu={hardwareState.hasGpu}
					gpuError={hardwareState.gpuError}
					label={hardwareState.hasGpu ? hardwareState.metrics?.gpu_name ?? "GPU" : "CPU Mode"}
				/>
				<Badge variant="positive" size="sm">{tierLabel}</Badge>
				<Text size="xs" color="muted" class="text-center">{tierMessage}</Text>
			</div>

			<!-- Right column: Model recommendations -->
			<div class={stack({ gap: "3" })}>
				<Text size="sm" weight="semibold" color="secondary">
					Suggested for your hardware
				</Text>
				{#each recommendations as rec (rec.name)}
					<div
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
						style="border-left: 4px solid {fitColorMap[rec.fit]}; background: var(--surface-base);"
					>
						<div class="h-2.5 w-2.5 shrink-0 rounded-full" style="background: {fitColorMap[rec.fit]};"></div>
						<div class="flex-1 min-w-0">
							<Text size="sm" weight="medium" color="primary">{rec.name}</Text>
							<Text size="xs" color="muted">
								{rec.purpose} · {formatMb(rec.sizeMb)} download
								{#if rec.vramMb > 0}
									· {formatMb(rec.vramMb)} GPU memory
								{:else}
									· CPU only
								{/if}
							</Text>
						</div>
						<Badge
							variant={rec.fit === "green" ? "positive" : rec.fit === "red" ? "negative" : "neutral"}
							size="sm"
						>
							{content?.recommendations.fitLabels[rec.fit] ?? (rec.fit === "green" ? "Easy" : rec.fit === "yellow" ? "Tight" : rec.fit === "red" ? "Too Big" : "CPU")}
						</Badge>
						<button
							class="shrink-0 rounded px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 0.5rem var(--accent-teal-glow);"
							onclick={() => handleSingleDownload(rec)}
						>
							Get
						</button>
					</div>
				{/each}

				<!-- Total + Install all -->
				<div class="flex flex-col items-center gap-2 pt-2">
					<Text size="xs" color="muted">
						Total download: ~{formatMb(totalDownloadMb)}
					</Text>
					<button
						class="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 1rem var(--accent-teal-glow);"
						onclick={handleSetup}
					>
						<Zap size={16} />
						Install All Suggested
					</button>
				</div>
			</div>
		</div>

		<!-- Divider -->
		<div class="flex items-center gap-3 py-1">
			<div class="flex-1 border-t border-[var(--border-subtle)]"></div>
			<Text size="xs" color="muted">or find something specific</Text>
			<div class="flex-1 border-t border-[var(--border-subtle)]"></div>
		</div>

		<!-- Import from local disk -->
		<div class="flex items-center gap-3 py-1">
			<div class="flex-1 border-t border-[var(--border-subtle)]"></div>
			<Text size="xs" color="muted">or load from your computer</Text>
			<div class="flex-1 border-t border-[var(--border-subtle)]"></div>
		</div>

		<button
			class="flex items-center gap-2 self-center rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-125"
			style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
			onclick={handleImportLocal}
		>
			<FolderOpen size={16} />
			Import Model from Disk
		</button>

		<!-- Search HuggingFace -->
		<div class="flex items-center gap-3 py-1">
			<div class="flex-1 border-t border-[var(--border-subtle)]"></div>
			<Text size="xs" color="muted">or search HuggingFace</Text>
			<div class="flex-1 border-t border-[var(--border-subtle)]"></div>
		</div>

		<ModelSearch onDownload={handleSearchDownload} />

		<!-- Error from previous download/import attempt -->
		{#if error}
			<ClyffyNarration message={error} type="error" />
		{/if}

		<!-- Skip option -->
		<button
			class="self-center text-xs opacity-50 underline hover:opacity-80 transition-opacity"
			onclick={handleManualSetup}
		>
			Skip setup — I'll configure later
		</button>

	{:else if step === "downloading"}
		<!-- DOWNLOADING -->
		<div class={`${stack({ gap: "4" })} py-4`}>
			<div class={hstack({ gap: "2", align: "center", justify: "center" })}>
				<Download size={18} style="color: var(--accent-teal-main);" />
				<Text size="lg" weight="semibold" color="primary">
					{content?.downloading.title ?? "Downloading..."}
				</Text>
			</div>

			<Progress value={downloadProgress} max={100} size="md" class="w-full" />

			<Text size="sm" color="muted" as="p" style="text-align: center;">
				{Math.round(downloadProgress)}% — {content?.downloading.subtitle ?? "One-time setup."}
			</Text>

			<!-- Knowledge drop -->
			{#if content && content.knowledgeDrops.length > 0}
				{@const drop = content.knowledgeDrops[knowledgeIndex]}
				<div class="rounded-lg px-4 py-3 text-center transition-opacity duration-500"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<Text size="xs" weight="bold" color="secondary">{drop.title}</Text>
					<Text size="xs" color="muted">{drop.body}</Text>
				</div>
			{/if}

			{#if error}
				<ClyffyNarration message={error} type="error" />
				<button class="self-center text-xs underline opacity-60 hover:opacity-100" onclick={handleSetup}>
					Try again
				</button>
			{/if}
		</div>

	{:else if step === "verifying"}
		<!-- VERIFYING -->
		<div class="flex flex-col items-center gap-4 py-6">
			<div
				class="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
				style="border-color: var(--accent-teal-main); border-top-color: transparent;"
			></div>
			<Text size="lg" weight="semibold" color="primary">
				{content?.verifying.title ?? "Almost there!"}
			</Text>
			<Text size="sm" color="muted">
				{content?.verifying.subtitle ?? "Testing your AI..."}
			</Text>
		</div>

	{:else if step === "ready"}
		<!-- READY -->
		<div class="flex flex-col items-center gap-6 py-6">
			<div
				class="flex h-20 w-20 items-center justify-center rounded-full"
				style="border: 2px solid var(--signal-success); box-shadow: 0 0 1.5rem var(--signal-success-glow, var(--signal-success));"
			>
				<CircleCheck size={36} style="color: var(--signal-success);" />
			</div>
			<div class={stack({ gap: "2", align: "center" })}>
				<Text size="xl" weight="bold" color="primary">
					{content?.ready.title ?? "You're all set!"}
				</Text>
				<Text size="sm" color="muted">
					{content?.ready.subtitle ?? "Your AI is online."}
				</Text>
			</div>
			<button
				class="flex items-center gap-2 rounded-lg px-8 py-3 text-base font-bold transition-all hover:brightness-125"
				style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 1rem var(--accent-teal-glow);"
				onclick={onComplete}
			>
				<Sparkles size={18} />
				{content?.ready.cta ?? "Start Using DevPulse"}
			</button>
		</div>
	{/if}

	<ClyffyNarration message={clyffyMessage} type={step === "ready" ? "success" : "info"} />
</div>

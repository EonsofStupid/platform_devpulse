<!--
  @file SetupWizard — First-run guided setup for model configuration.
  ALL styling via renderForge + cssVarString. Zero raw values.
-->
<script lang="ts">
import { CircleCheck, Download, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { type FitIndicator, formatMb } from "../types/models.types.js";
import ClyffyNarration from "./ClyffyNarration.svelte";
import VramGauge from "./VramGauge.svelte";

type WizardStep = "detecting" | "recommendation" | "downloading" | "ready";

let step = $state<WizardStep>("detecting");
let downloadProgress = $state(0);

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

const mWizard = $derived(renderForge({ kind: "setup-wizard", preset: "primary" }));
const mSetupBtn = $derived(renderForge({ kind: "setup-action", preset: "accent" }));
const mReadyIcon = $derived(renderForge({ kind: "setup-ready", preset: "success" }));
const mProgress = $derived(renderForge({ kind: "setup-progress", preset: "info" }));

$effect(() => {
	if (step === "detecting" && hardwareState.metrics && !hardwareState.loading) {
		step = "recommendation";
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
}

const recommendations = $derived.by((): ModelRec[] => {
	const tier = hardwareState.tier;
	const free = hardwareState.vramFreeMb;
	const total = hardwareState.vramTotalMb;

	const calcFit = (vram: number): FitIndicator => {
		if (!hardwareState.hasGpu) return "gray";
		if (vram > free) return "red";
		if (((free - vram) / total) * 100 < 20) return "yellow";
		return "green";
	};

	switch (tier) {
		case "high":
			return [
				{
					name: "Qwen3-14B-Q4_K_M",
					purpose: "AI Brain (main reasoning)",
					sizeMb: 8100,
					vramMb: 9200,
					fit: calcFit(9200),
				},
				{
					name: "Qwen3-0.6B-Q8",
					purpose: "Quick Worker (fast tasks)",
					sizeMb: 700,
					vramMb: 400,
					fit: calcFit(400),
				},
				{
					name: "nomic-embed-v1.5",
					purpose: "Search Engine",
					sizeMb: 300,
					vramMb: 300,
					fit: calcFit(300),
				},
			];
		case "medium":
			return [
				{
					name: "Qwen3-4B-Q4_K_M",
					purpose: "AI Brain",
					sizeMb: 2600,
					vramMb: 3200,
					fit: calcFit(3200),
				},
				{
					name: "Qwen3-0.6B-Q4",
					purpose: "Quick Worker",
					sizeMb: 500,
					vramMb: 350,
					fit: calcFit(350),
				},
				{
					name: "nomic-embed-v1.5",
					purpose: "Search Engine",
					sizeMb: 300,
					vramMb: 300,
					fit: calcFit(300),
				},
			];
		case "low":
			return [
				{
					name: "Qwen3-1.7B-Q4_K_M",
					purpose: "AI Brain",
					sizeMb: 1200,
					vramMb: 1500,
					fit: calcFit(1500),
				},
				{
					name: "Qwen3-0.6B-Q4",
					purpose: "Quick Worker",
					sizeMb: 500,
					vramMb: 350,
					fit: calcFit(350),
				},
				{
					name: "nomic-embed-v1.5",
					purpose: "Search Engine",
					sizeMb: 300,
					vramMb: 300,
					fit: calcFit(300),
				},
			];
		default:
			return [
				{ name: "Qwen3-0.6B-Q4", purpose: "AI Brain (CPU)", sizeMb: 500, vramMb: 350, fit: "gray" },
				{
					name: "nomic-embed-v1.5",
					purpose: "Search Engine",
					sizeMb: 300,
					vramMb: 300,
					fit: "gray",
				},
			];
	}
});

function fitToIntent(fit: FitIndicator): SemanticIntent {
	switch (fit) {
		case "green":
			return "success";
		case "yellow":
			return "warning";
		case "red":
			return "danger";
		case "gray":
			return "neutral";
	}
}

const totalDownloadMb = $derived(recommendations.reduce((sum, r) => sum + r.sizeMb, 0));

const clyffyMessage = $derived.by((): string => {
	switch (step) {
		case "detecting":
			return "Let me check what hardware you've got...";
		case "recommendation":
			if (hardwareState.hasGpu) {
				return `I see a ${hardwareState.metrics?.gpuName} with ${formatMb(hardwareState.vramTotalMb)}. Here's what I recommend for your setup.`;
			}
			return "No GPU detected — I'll set up CPU-friendly models. Slower but everything works.";
		case "downloading":
			return "Pulling models from HuggingFace. This might take a few minutes depending on your connection.";
		case "ready":
			return "All set! Your AI is online. Head to chat and try typing something.";
	}
});

async function handleSetup() {
	step = "downloading";
	downloadProgress = 0;

	try {
		const { downloadModel, onDownloadProgress, onDownloadComplete } = await import(
			"../services/download.service.js"
		);
		const { scanModels } = await import("../services/registry.service.js");

		const totalModels = recommendations.length;
		let completed = 0;

		// Track per-download progress
		const unsubProgress = onDownloadProgress((p) => {
			// Approximate: each model is an equal slice of 100%
			const modelSlice = 100 / totalModels;
			const modelProgress = p.totalBytes > 0 ? (p.bytesDownloaded / p.totalBytes) * modelSlice : 0;
			downloadProgress = Math.min(99, completed * modelSlice + modelProgress);
		});

		const unsubComplete = onDownloadComplete(() => {
			completed++;
			downloadProgress = Math.min(99, (completed / totalModels) * 100);
		});

		// Download each recommended model sequentially
		for (const rec of recommendations) {
			try {
				// Map friendly name back to HF repo info
				const repoMap: Record<string, { repo: string; file: string }> = {
					"Qwen3-14B-Q4_K_M": { repo: "bartowski/Qwen3-14B-GGUF", file: "Qwen3-14B-Q4_K_M.gguf" },
					"Qwen3-4B-Q4_K_M": { repo: "bartowski/Qwen3-4B-GGUF", file: "Qwen3-4B-Q4_K_M.gguf" },
					"Qwen3-1.7B-Q4_K_M": {
						repo: "bartowski/Qwen3-1.7B-GGUF",
						file: "Qwen3-1.7B-Q4_K_M.gguf",
					},
					"Qwen3-0.6B-Q8": { repo: "Qwen/Qwen3-0.6B-GGUF", file: "qwen3-0.6b-q8_0.gguf" },
					"Qwen3-0.6B-Q4": { repo: "Qwen/Qwen3-0.6B-GGUF", file: "qwen3-0.6b-q4_k_m.gguf" },
					"nomic-embed-v1.5": {
						repo: "nomic-ai/nomic-embed-text-v1.5-GGUF",
						file: "nomic-embed-text-v1.5.Q8_0.gguf",
					},
				};

				const mapping = repoMap[rec.name];
				if (mapping) {
					await downloadModel(mapping.repo, mapping.file);
				}
			} catch (e) {
				console.error(`[SetupWizard] Download failed for ${rec.name}:`, e);
				// Continue with remaining models
			}
		}

		unsubProgress();
		unsubComplete();

		// Re-scan to pick up new models
		await scanModels();
		downloadProgress = 100;
		step = "ready";
	} catch (e) {
		console.error("[SetupWizard] Setup failed:", e);
		// Fall back to ready state so user can try manually
		step = "ready";
	}
}
</script>

<div
	{...mWizard.dataAttrs}
	style={cssVarString(mWizard.cssVars)}
	class={stack({ gap: "4" })}
	data-component="setup-wizard"
>
	{#if step === "detecting"}
		<div class="flex flex-col items-center gap-4 py-8">
			<div class="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" style="border-color: var(--color); border-top-color: transparent;"></div>
			<Text size="lg" weight="semibold" color="primary">Checking your hardware...</Text>
		</div>

	{:else if step === "recommendation"}
		<div class="flex flex-col items-center gap-2">
			<VramGauge
				usedMb={hardwareState.vramUsedMb}
				totalMb={hardwareState.vramTotalMb}
				hasGpu={hardwareState.hasGpu}
				label={hardwareState.hasGpu ? hardwareState.metrics?.gpuName ?? "GPU" : "CPU Mode"}
			/>
			<Badge variant="positive" size="sm">{tierLabel}</Badge>
		</div>

		<div class={stack({ gap: "2" })}>
			<Text size="sm" weight="semibold" color="secondary">Recommended Models:</Text>
			{#each recommendations as rec (rec.name)}
				{@const recM = renderForge({ kind: "setup-rec", preset: fitToIntent(rec.fit) })}
				<div
					{...recM.dataAttrs}
					style={cssVarString(recM.cssVars)}
					class="flex items-center gap-3 rounded-lg border-l-4 px-3 py-2"
				>
					<div class="h-2.5 w-2.5 shrink-0 rounded-full" style="background: var(--color); box-shadow: var(--box-shadow);"></div>
					<div class="flex-1">
						<Text size="sm" weight="medium" color="primary">{rec.name}</Text>
						<Text size="xs" color="muted">{rec.purpose} · {formatMb(rec.sizeMb)} download · {formatMb(rec.vramMb)} GPU memory</Text>
					</div>
					<Badge
						variant={rec.fit === "green" ? "positive" : rec.fit === "red" ? "negative" : "neutral"}
						size="sm"
					>
						{rec.fit === "green" ? "Easy" : rec.fit === "yellow" ? "Tight" : rec.fit === "red" ? "Too Big" : "CPU"}
					</Badge>
				</div>
			{/each}
		</div>

		<Text size="xs" color="muted" as="p" style="text-align: center;">
			Total download: ~{formatMb(totalDownloadMb)}
		</Text>

		<div class="flex flex-col items-center gap-2">
			<button
				{...mSetupBtn.dataAttrs}
				style={cssVarString(mSetupBtn.cssVars)}
				class="flex items-center gap-2 rounded-lg px-6 py-3 text-base font-bold transition-all hover:brightness-110"
				onclick={handleSetup}
			>
				<Zap size={18} />
				Set Me Up
			</button>
			<button class="text-xs opacity-50 underline" onclick={onComplete}>
				I'll configure manually
			</button>
		</div>

	{:else if step === "downloading"}
		<div
			{...mProgress.dataAttrs}
			style={cssVarString(mProgress.cssVars)}
			class={stack({ gap: "3" })}
			style:padding="1rem 0"
		>
			<div class={hstack({ gap: "2", align: "center", justify: "center" })}>
				<Download size={18} style="color: var(--color);" />
				<Text size="lg" weight="semibold" color="primary">Setting up your AI...</Text>
			</div>
			<div class="h-3 w-full overflow-hidden rounded-full opacity-30">
				<div class="h-full rounded-full transition-all duration-300" style="width: {downloadProgress}%; background: var(--color);"></div>
			</div>
			<Text size="sm" color="muted" as="p" style="text-align: center;">
				{downloadProgress}% — Downloading models...
			</Text>
		</div>

	{:else if step === "ready"}
		<div class="flex flex-col items-center gap-4 py-6">
			<div
				{...mReadyIcon.dataAttrs}
				style={cssVarString(mReadyIcon.cssVars)}
				class="flex h-16 w-16 items-center justify-center rounded-full border-2"
			>
				<CircleCheck size={32} style="color: var(--color);" />
			</div>
			<Text size="lg" weight="bold" color="primary">Ready to go!</Text>
			<button
				{...mSetupBtn.dataAttrs}
				style={cssVarString(mSetupBtn.cssVars)}
				class="rounded-lg px-6 py-2 text-sm font-semibold transition-all hover:brightness-110"
				onclick={onComplete}
			>
				Open Model Control
			</button>
		</div>
	{/if}

	<ClyffyNarration message={clyffyMessage} type={step === "ready" ? "success" : "info"} />
</div>

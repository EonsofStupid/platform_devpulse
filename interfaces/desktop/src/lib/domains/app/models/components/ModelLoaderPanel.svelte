<!--
  @file ModelLoaderPanel — Consumer-grade 4-card model loader.
  Brain, Vision, Voice, Memory — zero jargon in default view.
  Advanced toggle shows slot IDs and technical details.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { FolderOpen, Search, Settings, Zap } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { narrationState } from "../runes/narration.runes.svelte.js";
import { downloadModel, importLocalModel } from "../services/download.service.js";
import BrainCard from "./BrainCard.svelte";
import ClyffyNarration from "./ClyffyNarration.svelte";
import MemoryCard from "./MemoryCard.svelte";
import ModelSearch from "./ModelSearch.svelte";
import VisionCard from "./VisionCard.svelte";
import VoiceCard from "./VoiceCard.svelte";
import VramGauge from "./VramGauge.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

// ── Local State ───────────────────────────────────────────────

let showSearch = $state(false);
let advancedMode = $state(false);
let error = $state<string | null>(null);
let health = $state<{ name: string; status: string; latency_us: number | null }[]>([]);

// ── Init ──────────────────────────────────────────────────────

$effect(() => {
	hardwareState.startListening();
	modelsState.refresh();
	modelsState.startStatusListener();
	narrationState.startListening();
	loadHealth();
	return () => {
		hardwareState.stopListening();
		modelsState.stopStatusListener();
		narrationState.stopListening();
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
		console.warn("[ModelLoaderPanel] Health check failed:", e);
	}
}

// ── Actions ───────────────────────────────────────────────────

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
	class={`${stack({ gap: "4" })} w-full`}
	style="background: var(--surface-base); color: var(--text-primary);"
	data-component="model-loader-panel"
>
	<!-- Header -->
	<div class={hstack({ justify: "between", align: "center" })}>
		<div class={stack({ gap: "1" })}>
			<Text size="lg" weight="bold" color="primary">Set Up Clyffy</Text>
			<Text size="xs" color="muted">Choose what Clyffy can do on your PC</Text>
		</div>
		<div class={hstack({ gap: "3", align: "center" })}>
			<div title="Shows how much of your graphics card memory is being used by AI models — if you don't have a graphics card, models run on CPU using regular RAM instead">
				<VramGauge
					usedMb={hardwareState.vramUsedMb}
					totalMb={hardwareState.vramTotalMb}
					hasGpu={hardwareState.hasGpu}
					gpuError={hardwareState.gpuError}
					label={hardwareState.hasGpu ? hardwareState.metrics?.gpu_name ?? "GPU" : "CPU Mode"}
				/>
			</div>
			<button
				class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
				style={advancedMode
					? "background: var(--accent-teal-main); color: var(--surface-base);"
					: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-muted);"}
				onclick={() => { advancedMode = !advancedMode; }}
				title={advancedMode
					? "Switch back to the simple view — hides technical details"
					: "Show advanced details — slot IDs, file paths, formats, and technical info for developers"}
			>
				<Settings size={12} />
				{advancedMode ? "Simple" : "Advanced"}
			</button>
		</div>
	</div>

	<!-- 4-Card Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<BrainCard advanced={advancedMode} />
		<VisionCard advanced={advancedMode} />
		<VoiceCard advanced={advancedMode} />
		<MemoryCard advanced={advancedMode} />
	</div>

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
			title="Pick a model file (.gguf) from your computer and copy it into Clyffy's model folder"
		>
			<FolderOpen size={14} />
			Import from Disk
		</button>

		<button
			class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:brightness-110"
			style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
			onclick={() => (showSearch = !showSearch)}
			title="Search HuggingFace for AI models — browse thousands of community models and download them directly"
		>
			<Search size={14} />
			{showSearch ? "Hide Search" : "Search HuggingFace"}
		</button>

		<button
			class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all hover:brightness-125"
			style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 0.75rem var(--accent-teal-glow);"
			onclick={handleApplyAndLaunch}
			title="Save your model choices and open the chat — Clyffy will load the selected models and be ready to talk"
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

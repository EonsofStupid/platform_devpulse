<!--
  @file ModelLoaderPanel — Consumer-grade 4-card model loader.
  Brain, Vision, Voice, Memory — zero jargon in default view.
  Advanced toggle shows slot IDs and technical details.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { FolderOpen, Search, Settings, X, Zap } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { competencyTracker } from "../../data-access/competency.service.js";
import { downloadModel, importLocalModel } from "../../data-access/download.service.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";
import { swapState } from "../../data-access/swap.state.svelte.js";
import ClyffyNarration from "../../ui/ClyffyNarration.svelte";
import VramGauge from "../../ui/VramGauge.svelte";
import { friendlySlotLabel, slotDescription } from "../../util/models.types.js";
import BrainCard from "./BrainCard.svelte";
import MemoryCard from "./MemoryCard.svelte";
import ModelSearch from "./ModelSearch.svelte";
import SubsystemGroup from "./SubsystemGroup.svelte";
import VisionCard from "./VisionCard.svelte";
import VoiceCard from "./VoiceCard.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();

// ── Local State ───────────────────────────────────────────────

let showSearch = $state(false);
let showImportSlotPicker = $state(false);
let advancedMode = $state(false);
let error = $state<string | null>(null);
let health = $state<{ name: string; status: string; latency_us: number | null }[]>([]);

// ── Init ──────────────────────────────────────────────────────

$effect(() => {
	hardwareState.startListening();
	void (async () => {
		await modelsState.startStatusListener();
		await modelsState.refresh();
	})();
	swapState.startListening();
	narrationState.startListening();
	competencyTracker.load();
	loadHealth();
	return () => {
		hardwareState.stopListening();
		modelsState.stopStatusListener();
		swapState.stopListening();
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

function handleImportClick(): void {
	showImportSlotPicker = !showImportSlotPicker;
}

async function handleImportForSlot(slotId: string): Promise<void> {
	error = null;
	showImportSlotPicker = false;
	try {
		await importLocalModel(slotId);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		error = `Import failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleSearchDownload(repoId: string, filename: string): Promise<string> {
	error = null;
	try {
		return await downloadModel(repoId, filename);
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
		throw e;
	}
}

const subsystemLabels: Record<string, string> = {
	chat: "Chat & Reasoning",
	minion: "Background Workers",
	vision: "Vision",
	voice: "Voice",
	rag: "Memory & Search",
};

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
	class={`${stack({ gap: "4" })} w-full min-h-full`}
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
			<Tooltip openDelay={500}>
				<TooltipTrigger>
					<VramGauge
						usedMb={hardwareState.vramUsedMb}
						totalMb={hardwareState.vramTotalMb}
						hasGpu={hardwareState.hasGpu}
						gpuError={hardwareState.gpuError}
						label={hardwareState.hasGpu ? hardwareState.metrics?.gpu_name ?? "GPU" : "CPU Mode"}
					/>
				</TooltipTrigger>
				<TooltipContent>How much graphics card memory AI models are using — no GPU means CPU mode</TooltipContent>
			</Tooltip>
			<Tooltip openDelay={400}>
				<TooltipTrigger>
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
						style={advancedMode
							? "background: var(--accent-teal-main); color: var(--surface-base);"
							: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-muted);"}
						onclick={() => { advancedMode = !advancedMode; competencyTracker.setLevel(advancedMode ? 2 : 0); }}
					>
						<Settings size={12} />
						{advancedMode ? "Simple" : "Advanced"}
					</button>
				</TooltipTrigger>
				<TooltipContent>{advancedMode ? "Switch back to the simple view" : "Show slot IDs, file paths, and technical details"}</TooltipContent>
			</Tooltip>
		</div>
	</div>

	<!-- Model UI — Consumer cards or Advanced subsystem groups -->
	{#if advancedMode}
		{@const subsystems = (() => {
			const groups = new Map<string, typeof modelsState.slots>();
			modelsState.slots.forEach((slot) => {
				const prefix = slot.id.split(".")[0];
				const existing = groups.get(prefix) ?? [];
				existing.push(slot);
				groups.set(prefix, existing);
			});
			return groups;
		})()}
		<div class="flex flex-col gap-3">
			{#each [...subsystems.entries()] as [prefix, slots] (prefix)}
				<SubsystemGroup
					name={prefix}
					label={subsystemLabels[prefix] ?? prefix}
					{slots}
					layman={false}
				/>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<BrainCard advanced={advancedMode} />
			<VisionCard advanced={advancedMode} />
			<VoiceCard advanced={advancedMode} />
			<MemoryCard advanced={advancedMode} />
		</div>
	{/if}

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
		<Tooltip openDelay={400}>
			<TooltipTrigger>
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
					onclick={handleImportClick}
				>
					<FolderOpen size={14} />
					Import from Disk
				</button>
			</TooltipTrigger>
			<TooltipContent>Pick a .gguf model file from your computer</TooltipContent>
		</Tooltip>

		<Tooltip openDelay={400}>
			<TooltipTrigger>
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
					onclick={() => (showSearch = !showSearch)}
				>
					<Search size={14} />
					{showSearch ? "Hide Search" : "Search HuggingFace"}
				</button>
			</TooltipTrigger>
			<TooltipContent>Browse thousands of community AI models and download them</TooltipContent>
		</Tooltip>

		<Tooltip openDelay={400}>
			<TooltipTrigger>
				<button
					class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all hover:brightness-125"
					style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 0.75rem var(--accent-teal-glow);"
					onclick={handleApplyAndLaunch}
				>
					<Zap size={16} />
					Apply and Launch Clyffy
				</button>
			</TooltipTrigger>
			<TooltipContent>Save your choices and start chatting — Clyffy loads the models automatically</TooltipContent>
		</Tooltip>
	</div>

	<!-- Import Slot Picker — choose which slot to import into -->
	{#if showImportSlotPicker}
		<div
			class="rounded-xl border p-4"
			style="border-color: var(--accent-teal-main); background: var(--surface-base);"
		>
			<div class="mb-3 flex items-center justify-between">
				<Text size="sm" weight="bold" color="primary">What is this model for?</Text>
				<button
					class="rounded p-1 transition-colors hover:brightness-110"
					style="color: var(--text-muted);"
					onclick={() => { showImportSlotPicker = false; }}
					aria-label="Close slot picker"
				>
					<X size={14} />
				</button>
			</div>
			<div class="flex flex-col gap-1">
				{#each modelsState.userSlots as slot (slot.id)}
					<button
						class="flex flex-col gap-0.5 rounded-lg px-4 py-3 text-left transition-colors hover:brightness-110"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
						onclick={() => handleImportForSlot(slot.id)}
						title="{friendlySlotLabel(slot.id)} — {slotDescription(slot.id)}"
					>
						<span class="text-sm font-medium" style="color: var(--text-primary);">
							{friendlySlotLabel(slot.id)}
						</span>
						<span class="text-xs" style="color: var(--text-muted);">
							{slotDescription(slot.id)}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Inline HF Search -->
	{#if showSearch}
		<ModelSearch onDownload={handleSearchDownload} onClose={() => (showSearch = false)} />
	{/if}
</div>

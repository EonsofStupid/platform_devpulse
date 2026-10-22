<!--
  @file ModelLoaderPanel — Consumer-grade 4-card model loader.
  Brain, Vision, Voice, Memory — zero jargon in default view.
  Advanced toggle shows slot IDs and technical details.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { Tooltip, TooltipContent, TooltipTrigger } from "@devpulse/coldlight/components/tooltip";
import { hstack } from "@devpulse/coldlight/utils/hstack";
import { stack } from "@devpulse/coldlight/utils/stack";
import { FolderOpen, Search, Settings, X, Zap } from "lucide-svelte";
import type { Snippet } from "svelte";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelLoaderPanelState } from "../../data-access/model-loader-panel.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
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
	/** Header actions the composing route adds (links to related pages). */
	actions?: Snippet;
}

let { onComplete, actions }: Props = $props();
const panelState = modelLoaderPanelState;

// ── Init ──────────────────────────────────────────────────────

$effect(() => {
	void panelState.start();
	return () => {
		panelState.stop();
	};
});

const subsystemLabels: Record<string, string> = {
	chat: "Chat & Reasoning",
	minion: "Background Workers",
	vision: "Vision",
	voice: "Voice",
	rag: "Memory & Search",
};
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
			{@render actions?.()}
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
						style={panelState.advancedMode
							? "background: var(--accent-teal-main); color: var(--surface-base);"
							: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-muted);"}
						onclick={() => panelState.toggleAdvancedMode()}
					>
						<Settings size={12} />
						{panelState.advancedMode ? "Simple" : "Advanced"}
					</button>
				</TooltipTrigger>
				<TooltipContent>{panelState.advancedMode ? "Switch back to the simple view" : "Show slot IDs, file paths, and technical details"}</TooltipContent>
			</Tooltip>
		</div>
	</div>

	<!-- Model UI — Consumer cards or Advanced subsystem groups -->
	{#if panelState.advancedMode}
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
			<BrainCard advanced={panelState.advancedMode} />
			<VisionCard advanced={panelState.advancedMode} />
			<VoiceCard advanced={panelState.advancedMode} />
			<MemoryCard advanced={panelState.advancedMode} />
		</div>
	{/if}

	<!-- Platform Status Bar -->
	{#if panelState.health.length > 0}
		<div class="rounded-lg border px-4 py-3" style="border-color: var(--border-subtle); background: var(--surface-base);">
			<Text size="xs" weight="bold" color="secondary" class="mb-2">Platform Status</Text>
			<div class="flex flex-wrap gap-3">
				{#each panelState.health as svc (svc.name)}
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
	{#if panelState.error}
		<InlineMessage tone="error">{panelState.error}</InlineMessage>
	{/if}

	<!-- Bottom Actions -->
	<div class="flex flex-wrap items-center justify-center gap-3">
		<Tooltip openDelay={400}>
			<TooltipTrigger>
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
					onclick={() => panelState.toggleImportPicker()}
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
					onclick={() => panelState.toggleSearch()}
				>
					<Search size={14} />
					{panelState.showSearch ? "Hide Search" : "Search HuggingFace"}
				</button>
			</TooltipTrigger>
			<TooltipContent>Browse thousands of community AI models and download them</TooltipContent>
		</Tooltip>

		<Tooltip openDelay={400}>
			<TooltipTrigger>
				<button
					class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all hover:brightness-125"
					style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 0.75rem var(--accent-teal-glow);"
					onclick={() => panelState.applyAndLaunch(onComplete)}
					disabled={panelState.applying}
				>
					<Zap size={16} />
					{panelState.applying ? "Applying..." : "Apply and Launch Clyffy"}
				</button>
			</TooltipTrigger>
			<TooltipContent>Save your choices and start chatting — Clyffy loads the models automatically</TooltipContent>
		</Tooltip>
	</div>

	<!-- Import Slot Picker — choose which slot to import into -->
	{#if panelState.showImportSlotPicker}
		<div
			class="rounded-xl border p-4"
			style="border-color: var(--accent-teal-main); background: var(--surface-base);"
		>
			<div class="mb-3 flex items-center justify-between">
				<Text size="sm" weight="bold" color="primary">What is this model for?</Text>
				<button
					class="rounded p-1 transition-colors hover:brightness-110"
					style="color: var(--text-muted);"
					onclick={() => panelState.closeImportPicker()}
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
						onclick={() => panelState.importForSlot(slot.id)}
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
	{#if panelState.showSearch}
		<ModelSearch onDownload={(repoId, filename) => panelState.searchDownload(repoId, filename)} onClose={() => panelState.closeSearch()} />
	{/if}
</div>

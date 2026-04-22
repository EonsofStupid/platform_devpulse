<!--
  @file BrainCard — "Clyffy's Brain" card for the consumer model loader.
  Shows reasoning model selection with zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Download, Flame, Power, PowerOff, RefreshCw, Search, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { brainCardState } from "../../data-access/brain-card.state.svelte.js";
import { downloadModel } from "../../data-access/download.service.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";
import {
	formatEta,
	formatMb,
	formatSpeed,
	statusLabel,
	statusToTone,
} from "../../util/models.types.js";
import HuggingFaceSearch from "../setup-wizard/components/HuggingFaceSearch.svelte";
import ModelPicker from "./ModelPicker.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();
const brainState = brainCardState;

// HF search panel visibility. Defaults closed so the existing preset
// + ModelPicker flow stays the primary experience; users who want to
// bring a model in from HuggingFace have a clearly marked entry.
let hfSearchOpen = $state(false);

async function handleHfDownload(
	repoId: string,
	filename: string,
	_targetSlot: string,
): Promise<void> {
	// The HuggingFaceSearch component passes a targetSlot hint, but for
	// BrainCard we always want the download to land on chat.brain. The
	// download_model Tauri command is slot-agnostic — it just writes to
	// disk under the models/ tree and the next scan registers it.
	await downloadModel(repoId, filename);
	await modelsState.scan();
	await modelsState.refresh();
	// After the model lands on disk + is registered, pre-select it so
	// Save & Continue has a real assigned model (POAM §6.2 truth rule).
	const downloaded = modelsState.models.find((m) => m.filename === filename);
	if (downloaded) {
		brainState.selectModel(downloaded.id);
	}
}

$effect(() => {
	void brainState.ensureCatalogLoaded();
});

// ── ColdLight renderForge — glass-elevated preset ────────
const cardM = $derived(renderForge({ kind: "brain-card", preset: "glass-elevated" }));
</script>

<div
	{...cardM.dataAttrs}
	style="{cssVarString(cardM.cssVars)} border-left: 3px solid var(--accent-violet-main); box-shadow: 0 0 0 1px var(--accent-violet-fill);"
	class="rounded-xl p-5 transition-all"
	data-component="brain-card"
	data-role="brain"
	title="This is Clyffy's main thinking engine — the AI model that powers chat, reasoning, and code help"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<Text size="base" weight="bold" color="primary">{brainState.catalogLabel}</Text>
				<Text size="xs" color="muted">{brainState.catalogDescription}</Text>
			</div>
			<Badge
				variant={brainState.isLoaded ? "positive" : brainState.isWarm ? "positive" : brainState.hasModel ? "neutral" : "neutral"}
				size="sm"
				title={brainState.isLoaded
					? "This model is running and ready to use"
					: brainState.isWarm
						? "Model is pre-loaded in RAM — click Activate for full speed"
						: brainState.hasModel
							? "Model is downloaded but not running yet — click Activate to start it"
							: "You need to download this model before Clyffy can think"}
			>
				{brainState.isLoaded ? "Active" : brainState.isWarm ? "Warmed" : brainState.hasModel ? "Ready" : "Not installed"}
			</Badge>
		</div>

		<!-- Size selector — pick how smart vs how fast -->
		{#if brainState.catalogOptions.length > 0}
			<div>
				<Text size="xs" color="muted" title="Smaller models respond faster but give simpler answers. Larger models think deeper but need more graphics card memory.">Pick a size for your PC:</Text>
				<div class="mt-1 flex gap-2">
					{#each brainState.catalogOptions as brainOpt, i (brainOpt.label)}
						<button
							class="flex-1 rounded-lg px-3 py-2 text-center transition-all"
							style={brainState.selectedIdx === i
								? "background: var(--accent-teal-main); color: var(--surface-base);"
								: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"}
							onclick={() => brainState.selectCatalogIndex(i)}
							title={brainOpt.label.includes("Fast") || brainOpt.label.includes("4B")
								? "Optimized for speed — quick responses, works on most PCs (needs ~3 GB graphics card memory)"
								: brainOpt.label.includes("Smart") || brainOpt.label.includes("14B")
									? "Optimized for quality — best reasoning, needs a powerful graphics card (~10 GB)"
									: "Good balance of speed and quality — recommended for most PCs (~5 GB graphics card memory)"}
						>
							<div class="text-sm font-semibold">{brainOpt.label}</div>
							<div class="mt-0.5 text-xs opacity-70">{formatMb(brainOpt.size_mb)}</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Local model picker — shows models discovered on disk filtered by capability -->
		<ModelPicker
			models={brainState.compatibleModels}
			selectedModelId={brainState.selectedModelId}
			committedModelId={brainState.committedModelId}
			pendingModelId={brainState.pendingModelId}
			onSelect={(modelId) => brainState.selectModel(modelId)}
		/>

		<!-- Browse HuggingFace — inline search surfaced per POAM §9.1 / UX-REQ §1 -->
		<div class={stack({ gap: "2" })}>
			<button
				class="flex items-center gap-1.5 self-start rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
				onclick={() => (hfSearchOpen = !hfSearchOpen)}
				title="Search HuggingFace for any compatible brain model"
			>
				<Search size={12} />
				{hfSearchOpen ? "Hide HuggingFace Search" : "Browse HuggingFace"}
			</button>

			{#if hfSearchOpen}
				<div
					class="rounded-lg p-3"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<HuggingFaceSearch onDownload={handleHfDownload} />
				</div>
			{/if}
		</div>

		{#if brainState.pendingModel}
			<Text size="xs" color="muted">
				Pending change: {brainState.pendingModel.filename}. This selection applies when you save.
			</Text>
		{/if}

		<!-- Loading progress -->
		{#if brainState.isTransitioning && brainState.modelStatus}
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Spinner size="sm" tone={statusToTone(brainState.modelStatus)} />
					<Text size="xs" color="muted">{statusLabel(brainState.modelStatus)}</Text>
				</div>
				{#if brainState.modelStatus.type === "loading"}
					<div
						class="h-1.5 w-full overflow-hidden rounded-full"
						style="background: var(--border-subtle);"
					>
						<div
							class="h-full rounded-full transition-all duration-300"
							style="width: {brainState.modelStatus.progressPct}%; background: var(--accent-teal-main);"
						></div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Action bar -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if brainState.downloading}
				<div class={stack({ gap: "1" })} style="flex: 1;">
					<div class={hstack({ justify: "between", align: "center" })}>
						<div class={hstack({ gap: "1", align: "center" })}>
							<Spinner size="sm" tone="accent" />
							<Text size="xs" color="muted">Downloading {brainState.downloadPct}%</Text>
						</div>
						<div class={hstack({ gap: "2", align: "center" })}>
							{#if brainState.downloadSpeedBps > 0}
								<Text size="xs" color="muted">{formatSpeed(brainState.downloadSpeedBps)}</Text>
							{/if}
							{#if brainState.downloadEtaSecs >= 0}
								<Text size="xs" color="muted">{formatEta(brainState.downloadEtaSecs)}</Text>
							{/if}
							<button
								class="rounded p-1 transition-colors hover:brightness-125"
								style="color: var(--signal-error);"
								onclick={() => brainState.handleCancelDownload()}
								title="Cancel download"
								aria-label="Cancel download"
							>
								<X size={12} />
							</button>
						</div>
					</div>
					<div
						class="h-1.5 w-full overflow-hidden rounded-full"
						style="background: var(--border-subtle);"
					>
						<div
							class="h-full rounded-full transition-all duration-300"
							style="width: {brainState.downloadPct}%; background: var(--accent-teal-main);"
						></div>
					</div>
				</div>
			{:else if !brainState.hasModel}
				<div class={stack({ gap: "1" })}>
					{#if hardwareState.diskFreeMb !== null && brainState.opt.size_mb > 0}
						<Text size="xs" color="muted">
							{formatMb(brainState.opt.size_mb)} download · {formatMb(hardwareState.diskFreeMb)} free on disk
						</Text>
					{/if}
					<Tooltip openDelay={400}>
						<TooltipTrigger>
							<button
								class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
								style="background: var(--accent-teal-main); color: var(--surface-base);"
								onclick={() => brainState.handleDownload()}
								disabled={brainState.isTransitioning}
							>
								<Download size={14} />
								Install ({formatMb(brainState.opt.size_mb)})
							</button>
						</TooltipTrigger>
						<TooltipContent>One-time download — runs entirely on your PC, no cloud needed</TooltipContent>
					</Tooltip>
				</div>
			{:else if brainState.isLoaded}
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
							onclick={() => brainState.handleUnload()}
							disabled={brainState.isTransitioning}
						>
							<PowerOff size={12} />
							Deactivate
						</button>
					</TooltipTrigger>
					<TooltipContent>Turn off to free graphics card memory</TooltipContent>
				</Tooltip>
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
							onclick={() => brainState.handleSwap()}
							disabled={brainState.isTransitioning}
						>
							<RefreshCw size={12} />
							Switch Size
						</button>
					</TooltipTrigger>
					<TooltipContent>Switch to the selected size — Clyffy pauses briefly</TooltipContent>
				</Tooltip>
			{:else if brainState.isWarm}
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => brainState.handleLoad()}
							disabled={brainState.isTransitioning}
						>
							<Power size={14} />
							Activate (fast — already in RAM)
						</button>
					</TooltipTrigger>
					<TooltipContent>Move from RAM to GPU for full-speed inference</TooltipContent>
				</Tooltip>
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
							onclick={() => brainState.handleUnload()}
							disabled={brainState.isTransitioning}
						>
							<PowerOff size={12} />
							Release RAM
						</button>
					</TooltipTrigger>
					<TooltipContent>Remove from RAM to free memory</TooltipContent>
				</Tooltip>
			{:else}
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => brainState.handleLoad()}
							disabled={brainState.isTransitioning}
						>
							<Power size={14} />
							Activate
						</button>
					</TooltipTrigger>
					<TooltipContent>Load this model into your graphics card so Clyffy can think</TooltipContent>
				</Tooltip>
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
							onclick={() => brainState.handleWarm()}
							disabled={brainState.isTransitioning}
						>
							<Flame size={12} />
							Warm Up
						</button>
					</TooltipTrigger>
					<TooltipContent>Pre-load into RAM without GPU — makes activation faster later</TooltipContent>
				</Tooltip>
			{/if}
		</div>

		<!-- Advanced view -->
		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					Slot: {brainState.slotId} | File: {brainState.opt.file} | Format: GGUF | Size: {brainState.opt.size_mb}MB
				</Text>
			</div>
		{/if}

		<!-- Clyffy narration -->
		{#if narrationState.forSlot(brainState.slotId)}
			{@const msg = narrationState.forSlot(brainState.slotId)}
			{#if msg}
				<div
					class="rounded-lg border-l-2 px-3 py-2 text-xs"
					style="background: oklch(0.15 0.02 185 / 0.3); border-color: var(--accent-teal-main); color: var(--text-secondary);"
				>
					{msg.text}
				</div>
			{/if}
		{/if}

		<!-- Error -->
		{#if brainState.error}
			<Text size="xs" color="negative">{brainState.error}</Text>
		{/if}
	</div>
</div>

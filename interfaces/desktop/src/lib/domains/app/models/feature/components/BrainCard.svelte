<!--
  @file BrainCard — "Clyffy's Brain" card for the consumer model loader.
  Shows reasoning model selection with zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Download, Flame, Power, PowerOff, RefreshCw, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { getCatalogForSlot } from "../../data-access/catalog.service.js";
import {
	cancelDownload,
	downloadModel,
	onDownloadProgress,
} from "../../data-access/download.service.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";
import {
	formatEta,
	formatMb,
	formatSpeed,
	slotDisplayStatus,
	statusColor,
	statusLabel,
	statusToTone,
} from "../../util/models.types.js";
import ModelPicker from "./ModelPicker.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();

// ── Catalog from Rust TOML (no hardcoded constants) ──────────

const SLOT_ID = "chat.brain";

import type { CatalogOption } from "$lib/sys/generated/bindings.js";

let catalogOptions = $state<CatalogOption[]>([]);
let catalogLabel = $state("Clyffy's Brain");
let catalogDescription = $state("Main reasoning model for chat");

$effect(() => {
	getCatalogForSlot(SLOT_ID).then((entry) => {
		if (entry) {
			catalogLabel = entry.label;
			catalogDescription = entry.description;
			catalogOptions = entry.options;
		}
	});
});

// ── State ─────────────────────────────────────────────────────

let selectedIdx = $state(0);
let downloading = $state(false);
let downloadId = $state<string | null>(null);
let downloadPct = $state(0);
let downloadSpeedBps = $state(0);
let downloadEtaSecs = $state(-1);
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

const opt = $derived(
	catalogOptions[selectedIdx] ?? { label: "", repo: "", file: "", size_mb: 0, is_dir: false },
);

const brainStatus = $derived(
	slotDisplayStatus(
		modelsState.statuses[SLOT_ID],
		!!modelsState.slots.find((s) => s.id === SLOT_ID)?.assigned_model_id,
	),
);
const isLoaded = $derived(brainStatus === "active");
const hasModel = $derived(brainStatus !== "not_downloaded");
const slotCapability = $derived(
	modelsState.slots.find((s) => s.id === SLOT_ID)?.capability ?? "text_generation",
);
const modelStatus = $derived(modelsState.statuses[SLOT_ID]);
const isTransitioning = $derived(
	modelStatus?.type === "loading" || modelStatus?.type === "unloading",
);
const isWarm = $derived(modelStatus?.type === "warm");

// ── Actions ───────────────────────────────────────────────────

async function handleDownload(): Promise<void> {
	if (!opt.repo) return;
	error = null;
	downloading = true;
	downloadPct = 0;
	downloadSpeedBps = 0;
	downloadEtaSecs = -1;

	const unsubProgress = onDownloadProgress((p) => {
		if (p.totalBytes > 0) {
			downloadPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		}
		downloadSpeedBps = p.speedBps;
		downloadEtaSecs = p.etaSecs;
		if (!downloadId && p.downloadId) {
			downloadId = p.downloadId;
		}
	});

	try {
		const id = await downloadModel(opt.repo, opt.file);
		downloadId = id;
		// Wait for download-complete event (downloadModel returns after start, not completion)
		// The progress listener updates until 100%
		downloadPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
		const model = modelsState.models.find((m) => m.filename === opt.file);
		if (model) {
			await modelsState.assign(SLOT_ID, model.id);
		}
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloading = false;
		downloadId = null;
		unsubProgress();
	}
}

async function handleCancelDownload(): Promise<void> {
	if (!downloadId) return;
	try {
		await cancelDownload(downloadId);
		downloading = false;
		downloadId = null;
		downloadPct = 0;
	} catch (e) {
		error = `Cancel failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleLoad(): Promise<void> {
	error = null;
	try {
		await modelsState.load(SLOT_ID);
	} catch (e) {
		error = `Load failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleUnload(): Promise<void> {
	error = null;
	try {
		await modelsState.unload(SLOT_ID);
	} catch (e) {
		error = `Unload failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleWarm(): Promise<void> {
	error = null;
	try {
		await modelsState.warm(SLOT_ID);
	} catch (e) {
		error = `Warm failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleSwap(): Promise<void> {
	const model = modelsState.models.find((m) => m.filename === opt.file);
	if (!model) {
		error = `Download "${opt.label}" first before switching.`;
		return;
	}
	error = null;
	try {
		await modelsState.swap(SLOT_ID, model.id);
	} catch (e) {
		error = `Switch failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}
</script>

<div
	class="rounded-xl border p-5 transition-all"
	style="border-color: var(--border-subtle); background: var(--surface-base);"
	data-component="brain-card"
	title="This is Clyffy's main thinking engine — the AI model that powers chat, reasoning, and code help"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<Text size="base" weight="bold" color="primary">{catalogLabel}</Text>
				<Text size="xs" color="muted">{catalogDescription}</Text>
			</div>
			<Badge
				variant={isLoaded ? "positive" : isWarm ? "positive" : hasModel ? "neutral" : "neutral"}
				size="sm"
				title={isLoaded
					? "This model is running and ready to use"
					: isWarm
						? "Model is pre-loaded in RAM — click Activate for full speed"
						: hasModel
							? "Model is downloaded but not running yet — click Activate to start it"
							: "You need to download this model before Clyffy can think"}
			>
				{isLoaded ? "Active" : isWarm ? "Warmed" : hasModel ? "Ready" : "Not installed"}
			</Badge>
		</div>

		<!-- Size selector — pick how smart vs how fast -->
		{#if catalogOptions.length > 0}
			<div>
				<Text size="xs" color="muted" title="Smaller models respond faster but give simpler answers. Larger models think deeper but need more graphics card memory.">Pick a size for your PC:</Text>
				<div class="mt-1 flex gap-2">
					{#each catalogOptions as brainOpt, i (brainOpt.label)}
						<button
							class="flex-1 rounded-lg px-3 py-2 text-center transition-all"
							style={selectedIdx === i
								? "background: var(--accent-teal-main); color: var(--surface-base);"
								: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"}
							onclick={() => { selectedIdx = i; }}
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

		<!-- Local model picker -->
		<ModelPicker
			slotId={SLOT_ID}
			capability={slotCapability}
			onAssign={() => { error = null; }}
		/>

		<!-- Loading progress -->
		{#if isTransitioning && modelStatus}
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Spinner size="sm" tone={statusToTone(modelStatus)} />
					<Text size="xs" color="muted">{statusLabel(modelStatus)}</Text>
				</div>
				{#if modelStatus.type === "loading"}
					<div
						class="h-1.5 w-full overflow-hidden rounded-full"
						style="background: var(--border-subtle);"
					>
						<div
							class="h-full rounded-full transition-all duration-300"
							style="width: {modelStatus.progressPct}%; background: var(--accent-teal-main);"
						></div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Action bar -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if downloading}
				<div class={stack({ gap: "1" })} style="flex: 1;">
					<div class={hstack({ justify: "between", align: "center" })}>
						<div class={hstack({ gap: "1", align: "center" })}>
							<Spinner size="sm" tone="accent" />
							<Text size="xs" color="muted">Downloading {downloadPct}%</Text>
						</div>
						<div class={hstack({ gap: "2", align: "center" })}>
							{#if downloadSpeedBps > 0}
								<Text size="xs" color="muted">{formatSpeed(downloadSpeedBps)}</Text>
							{/if}
							{#if downloadEtaSecs >= 0}
								<Text size="xs" color="muted">{formatEta(downloadEtaSecs)}</Text>
							{/if}
							<button
								class="rounded p-1 transition-colors hover:brightness-125"
								style="color: var(--signal-error);"
								onclick={handleCancelDownload}
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
							style="width: {downloadPct}%; background: var(--accent-teal-main);"
						></div>
					</div>
				</div>
			{:else if !hasModel}
				<div class={stack({ gap: "1" })}>
					{#if hardwareState.diskFreeMb !== null && opt.size_mb > 0}
						<Text size="xs" color="muted">
							{formatMb(opt.size_mb)} download · {formatMb(hardwareState.diskFreeMb)} free on disk
						</Text>
					{/if}
					<Tooltip openDelay={400}>
						<TooltipTrigger>
							<button
								class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
								style="background: var(--accent-teal-main); color: var(--surface-base);"
								onclick={handleDownload}
								disabled={isTransitioning}
							>
								<Download size={14} />
								Install ({formatMb(opt.size_mb)})
							</button>
						</TooltipTrigger>
						<TooltipContent>One-time download — runs entirely on your PC, no cloud needed</TooltipContent>
					</Tooltip>
				</div>
			{:else if isLoaded}
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
							onclick={handleUnload}
							disabled={isTransitioning}
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
							onclick={handleSwap}
							disabled={isTransitioning}
						>
							<RefreshCw size={12} />
							Switch Size
						</button>
					</TooltipTrigger>
					<TooltipContent>Switch to the selected size — Clyffy pauses briefly</TooltipContent>
				</Tooltip>
			{:else if isWarm}
				<Tooltip openDelay={400}>
					<TooltipTrigger>
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={handleLoad}
							disabled={isTransitioning}
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
							onclick={handleUnload}
							disabled={isTransitioning}
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
							onclick={handleLoad}
							disabled={isTransitioning}
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
							onclick={handleWarm}
							disabled={isTransitioning}
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
					Slot: {SLOT_ID} | File: {opt.file} | Format: GGUF | Size: {opt.size_mb}MB
				</Text>
			</div>
		{/if}

		<!-- Clyffy narration -->
		{#if narrationState.forSlot(SLOT_ID)}
			{@const msg = narrationState.forSlot(SLOT_ID)}
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
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>

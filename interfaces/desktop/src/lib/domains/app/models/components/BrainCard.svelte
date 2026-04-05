<!--
  @file BrainCard — "Clyffy's Brain" card for the consumer model loader.
  Shows reasoning model selection with zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Download, Loader2, Power, PowerOff, RefreshCw } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { getCatalogForSlot } from "../services/catalog.service.js";
import { downloadModel, onDownloadProgress } from "../services/download.service.js";
import { formatMb } from "../types/models.types.js";

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
let downloadPct = $state(0);
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

const opt = $derived(catalogOptions[selectedIdx]);

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

const brainStatus = $derived(slotStatus(SLOT_ID));
const isLoaded = $derived(brainStatus === "loaded");
const hasModel = $derived(brainStatus !== "not_downloaded");

// ── Actions ───────────────────────────────────────────────────

async function handleDownload(): Promise<void> {
	error = null;
	downloading = true;
	downloadPct = 0;

	const unsubProgress = onDownloadProgress((p) => {
		if (p.totalBytes > 0) {
			downloadPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		}
	});

	try {
		await downloadModel(opt.repo, opt.file);
		downloadPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloading = false;
		unsubProgress();
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
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<Text size="base" weight="bold" color="primary">{catalogLabel}</Text>
				<Text size="xs" color="muted">{catalogDescription}</Text>
			</div>
			<Badge
				variant={isLoaded ? "positive" : hasModel ? "neutral" : "neutral"}
				size="sm"
			>
				{isLoaded ? "Active" : hasModel ? "Ready" : "Not installed"}
			</Badge>
		</div>

		<!-- Size selector -->
		<div class="flex gap-2">
			{#each catalogOptions as brainOpt, i (brainOpt.label)}
				<button
					class="flex-1 rounded-lg px-3 py-2 text-center transition-all"
					style={selectedIdx === i
						? "background: var(--accent-teal-main); color: var(--surface-base);"
						: "background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"}
					onclick={() => { selectedIdx = i; }}
				>
					<div class="text-sm font-semibold">{brainOpt.label}</div>
					<div class="mt-0.5 text-xs opacity-70">{formatMb(brainOpt.size_mb)}</div>
				</button>
			{/each}
		</div>

		<!-- Action bar -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if downloading}
				<div class={hstack({ gap: "1", align: "center" })}>
					<Loader2 size={14} class="animate-spin" style="color: var(--accent-teal-main);" />
					<Text size="xs" color="muted">Downloading {downloadPct}%</Text>
				</div>
			{:else if !hasModel}
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
					style="background: var(--accent-teal-main); color: var(--surface-base);"
					onclick={handleDownload}
				>
					<Download size={14} />
					Install ({formatMb(opt.size_mb)})
				</button>
			{:else if isLoaded}
				<button
					class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
					onclick={handleUnload}
				>
					<PowerOff size={12} />
					Deactivate
				</button>
				<button
					class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
					onclick={handleSwap}
				>
					<RefreshCw size={12} />
					Switch Size
				</button>
			{:else}
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
					style="background: var(--accent-teal-main); color: var(--surface-base);"
					onclick={handleLoad}
				>
					<Power size={14} />
					Activate
				</button>
			{/if}
		</div>

		<!-- Advanced view -->
		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					Slot: {SLOT_ID} | File: {opt.file} | Size: {opt.size_mb}MB
				</Text>
			</div>
		{/if}

		<!-- Error -->
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>

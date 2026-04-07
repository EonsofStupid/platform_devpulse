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
import { narrationState } from "../runes/narration.runes.svelte.js";
import { getCatalogForSlot } from "../services/catalog.service.js";
import { downloadModel, onDownloadProgress } from "../services/download.service.js";
import { formatMb, slotDisplayStatus } from "../types/models.types.js";

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

// ── Actions ───────────────────────────────────────────────────

async function handleDownload(): Promise<void> {
	if (!opt.repo) return;
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
		// Auto-assign downloaded model to this slot
		const model = modelsState.models.find((m) => m.filename === opt.file);
		if (model) {
			await modelsState.assign(SLOT_ID, model.id);
		}
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
				variant={isLoaded ? "positive" : hasModel ? "neutral" : "neutral"}
				size="sm"
				title={isLoaded
					? "This model is running and ready to use"
					: hasModel
						? "Model is downloaded but not running yet — click Activate to start it"
						: "You need to download this model before Clyffy can think"}
			>
				{isLoaded ? "Active" : hasModel ? "Ready" : "Not installed"}
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

		<!-- Action bar -->
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if downloading}
				<div class={hstack({ gap: "1", align: "center" })}>
					<Loader2 size={14} class="animate-spin" style="color: var(--accent-teal-main);" />
					<Text size="xs" color="muted" title="Downloading the model from HuggingFace — this may take a few minutes depending on your internet speed">Downloading {downloadPct}%</Text>
				</div>
			{:else if !hasModel}
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
					style="background: var(--accent-teal-main); color: var(--surface-base);"
					onclick={handleDownload}
					title="Download this AI model to your computer — it's a one-time download and runs entirely on your PC (no cloud needed)"
				>
					<Download size={14} />
					Install ({formatMb(opt.size_mb)})
				</button>
			{:else if isLoaded}
				<button
					class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
					onclick={handleUnload}
					title="Turn off this model to free up graphics card memory — you can turn it back on anytime"
				>
					<PowerOff size={12} />
					Deactivate
				</button>
				<button
					class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
					onclick={handleSwap}
					title="Switch to the selected size without losing your place — Clyffy will briefly pause while switching"
				>
					<RefreshCw size={12} />
					Switch Size
				</button>
			{:else}
				<button
					class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
					style="background: var(--accent-teal-main); color: var(--surface-base);"
					onclick={handleLoad}
					title="Turn on this AI model so Clyffy can start thinking — this loads it into your graphics card memory"
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

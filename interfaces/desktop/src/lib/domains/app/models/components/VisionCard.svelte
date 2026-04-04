<!--
  @file VisionCard — "How Clyffy sees your screen" card for the consumer model loader.
  Auto-detects built-in VLM vs SigLIP2. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Download, Eye, Loader2, Power, PowerOff } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { downloadModel, onDownloadProgress } from "../services/download.service.js";
import { formatMb } from "../types/models.types.js";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();

// ── Catalog ───────────────────────────────────────────────────

const VISION_OPTION = {
	label: "Built-in (recommended)",
	repo: "onnx-community/siglip2-base-patch16-256-ONNX",
	file: "vision_model_int8.onnx",
	sizeMb: 95,
};

const SLOT_ID = "vision.embedder";

// ── State ─────────────────────────────────────────────────────

let downloading = $state(false);
let downloadPct = $state(0);
let autoCapture = $state(true);
let screenshotQuality = $state<"standard" | "high">("standard");
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

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

const visionStatus = $derived(slotStatus(SLOT_ID));
const isLoaded = $derived(visionStatus === "loaded");
const hasModel = $derived(visionStatus !== "not_downloaded");

// Check if the brain model has built-in vision (Phi-4, Qwen3-VL, Qwen3.5)
const brainHasVision = $derived.by(() => {
	const brainSlot = modelsState.slots.find((s) => s.id === "chat.brain");
	if (!brainSlot?.assigned_model_id) return false;
	const model = modelsState.models.find((m) => m.id === brainSlot.assigned_model_id);
	if (!model) return false;
	const vlmPatterns = ["phi-4-multimodal", "qwen3-vl", "qwen3.5"];
	return vlmPatterns.some((p) => model.filename.toLowerCase().includes(p));
});

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
		await downloadModel(VISION_OPTION.repo, VISION_OPTION.file);
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
		error = `Activation failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleUnload(): Promise<void> {
	error = null;
	try {
		await modelsState.unload(SLOT_ID);
	} catch (e) {
		error = `Deactivation failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}
</script>

<div
	class="rounded-xl border p-5 transition-all"
	style="border-color: var(--border-subtle); background: var(--surface-base);"
	data-component="vision-card"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Eye size={18} style="color: var(--accent-teal-main);" />
					<Text size="base" weight="bold" color="primary">Vision</Text>
				</div>
				<Text size="xs" color="muted">How Clyffy sees your screen</Text>
			</div>
			<Badge
				variant={isLoaded ? "positive" : hasModel ? "neutral" : "neutral"}
				size="sm"
			>
				{isLoaded ? "Active" : hasModel ? "Ready" : "Not installed"}
			</Badge>
		</div>

		<!-- Status description -->
		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			{#if brainHasVision}
				<Text size="sm" color="secondary">
					Using built-in vision from your Brain model (recommended).
					No extra download needed.
				</Text>
			{:else}
				<Text size="sm" color="secondary">
					Clyffy uses a separate eye to see your screen and help with visual
					problems like error dialogs and layout issues.
				</Text>
			{/if}
		</div>

		<!-- Settings -->
		<div class="flex gap-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
				<input
					type="checkbox"
					bind:checked={autoCapture}
					class="accent-teal-500"
				/>
				Auto-capture
			</label>

			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);">
				Quality:
				<select
					bind:value={screenshotQuality}
					class="rounded border px-2 py-0.5 text-xs"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				>
					<option value="standard">Standard</option>
					<option value="high">High</option>
				</select>
			</label>
		</div>

		<!-- Action bar (hidden if brain has built-in vision) -->
		{#if !brainHasVision}
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
						Install ({formatMb(VISION_OPTION.sizeMb)})
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
		{/if}

		<!-- Advanced view -->
		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					Slot: {SLOT_ID} | File: {VISION_OPTION.file} | Brain VLM: {brainHasVision ? "yes" : "no"}
				</Text>
			</div>
		{/if}

		<!-- Error -->
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>

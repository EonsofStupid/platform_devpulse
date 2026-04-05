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
import { narrationState } from "../runes/narration.runes.svelte.js";
import { getCatalogForSlot } from "../services/catalog.service.js";
import { downloadModel, onDownloadProgress } from "../services/download.service.js";
import { formatMb } from "../types/models.types.js";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();

// ── Catalog from Rust TOML ───────────────────────────────────

const SLOT_ID = "vision.embedder";

let visionRepo = $state("");
let visionFile = $state("");
let visionSizeMb = $state(0);

$effect(() => {
	getCatalogForSlot(SLOT_ID).then((entry) => {
		if (entry && entry.options.length > 0) {
			const opt = entry.options[0];
			visionRepo = opt.repo;
			visionFile = opt.file;
			visionSizeMb = opt.size_mb;
		}
	});
});

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
	if (status.type === "cold" || status.type === "warm") return "downloaded";
	if (status.type === "hot" || status.type === "standby") return "loaded";
	if (status.type === "loading") return "loading";
	if (status.type === "failed") return "error";
	return "downloaded";
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
		await downloadModel(visionRepo, visionFile);
		downloadPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
		const model = modelsState.models.find((m) => m.filename === visionFile);
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
	title="Lets Clyffy see what's on your screen — helps with error dialogs, layout issues, and visual problems"
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
				title={isLoaded
					? "Vision is active — Clyffy can see your screen"
					: hasModel
						? "Vision model is downloaded — click Activate to turn it on"
						: "You need to install the vision model so Clyffy can see your screen"}
			>
				{isLoaded ? "Active" : hasModel ? "Ready" : "Not installed"}
			</Badge>
		</div>

		<!-- Status description -->
		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			{#if brainHasVision}
				<Text size="sm" color="secondary" title="Your Brain model already includes vision — no separate download needed">
					Using built-in vision from your Brain model (recommended).
					No extra download needed.
				</Text>
			{:else}
				<Text size="sm" color="secondary" title="A small separate model that lets Clyffy understand screenshots and UI elements">
					Clyffy uses a separate eye to see your screen and help with visual
					problems like error dialogs and layout issues.
				</Text>
			{/if}
		</div>

		<!-- Settings -->
		<div class="flex gap-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="When on, Clyffy automatically takes screenshots when you switch windows or tabs">
				<input
					type="checkbox"
					bind:checked={autoCapture}
					class="accent-teal-500"
				/>
				Auto-capture
			</label>

			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="Higher quality captures more detail but uses more memory — Standard is fine for most uses">
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
					title="Download the vision model so Clyffy can see your screen — small download, runs on CPU"
					>
						<Download size={14} />
						Install ({formatMb(visionSizeMb)})
					</button>
				{:else if isLoaded}
					<button
						class="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
						onclick={handleUnload}
					title="Turn off vision to save memory — Clyffy won't see your screen until you reactivate"
					>
						<PowerOff size={12} />
						Deactivate
					</button>
				{:else}
					<button
						class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={handleLoad}
					title="Turn on vision so Clyffy can see your screen and help with visual problems"
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
					Slot: {SLOT_ID} | File: {visionFile} | Brain VLM: {brainHasVision ? "yes" : "no"}
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

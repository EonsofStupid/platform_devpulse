<!--
  @file VoiceCard — "Talk to Clyffy" card for the consumer model loader.
  STT + TTS as one section. Mic selection. Voice preview. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Download, ExternalLink, Loader2, Mic, Play, Volume2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { narrationState } from "../runes/narration.runes.svelte.js";
import { getCatalogForSlot } from "../services/catalog.service.js";
import { downloadModel, onDownloadProgress } from "../services/download.service.js";
import { formatMb } from "../types/models.types.js";
import VoiceSlotStatus from "./VoiceSlotStatus.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();

// ── Catalog from Rust TOML ───────────────────────────────────

const STT_SLOT = "voice.stt";
const TTS_SLOT = "voice.tts";

let sttRepo = $state("");
let sttFile = $state("");
let sttSizeMb = $state(0);
let ttsRepo = $state("");
let ttsFile = $state("");
let ttsSizeMb = $state(0);

$effect(() => {
	getCatalogForSlot(STT_SLOT).then((entry) => {
		if (entry && entry.options.length > 0) {
			sttRepo = entry.options[0].repo;
			sttFile = entry.options[0].file;
			sttSizeMb = entry.options[0].size_mb;
		}
	});
	getCatalogForSlot(TTS_SLOT).then((entry) => {
		if (entry && entry.options.length > 0) {
			ttsRepo = entry.options[0].repo;
			ttsFile = entry.options[0].file;
			ttsSizeMb = entry.options[0].size_mb;
		}
	});
});

// ── State ─────────────────────────────────────────────────────

let downloadingStt = $state(false);
let downloadingTts = $state(false);
let sttPct = $state(0);
let ttsPct = $state(0);
let pushToTalk = $state(false);
let voiceStyle = $state<"default" | "casual" | "focused">("default");
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

const sttStatus = $derived(slotStatus(STT_SLOT));
const ttsStatus = $derived(slotStatus(TTS_SLOT));
const sttReady = $derived(sttStatus === "loaded" || sttStatus === "downloaded");
const ttsReady = $derived(ttsStatus === "loaded" || ttsStatus === "downloaded");
const voiceReady = $derived(sttReady && ttsReady);

// ── Actions ───────────────────────────────────────────────────

async function handleDownloadStt(): Promise<void> {
	error = null;
	downloadingStt = true;
	sttPct = 0;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			sttPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
	});
	try {
		await downloadModel(sttRepo, sttFile);
		sttPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
		const sttModel = modelsState.models.find((m) => m.filename === sttFile);
		if (sttModel) {
			await modelsState.assign(STT_SLOT, sttModel.id);
		}
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloadingStt = false;
		unsub();
	}
}

async function handleDownloadTts(): Promise<void> {
	error = null;
	downloadingTts = true;
	ttsPct = 0;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			ttsPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
	});
	try {
		await downloadModel(ttsRepo, ttsFile);
		ttsPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
		const ttsModel = modelsState.models.find((m) => m.filename === ttsFile);
		if (ttsModel) {
			await modelsState.assign(TTS_SLOT, ttsModel.id);
		}
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloadingTts = false;
		unsub();
	}
}
</script>

<div
	class="rounded-xl border p-5 transition-all"
	style="border-color: var(--border-subtle); background: var(--surface-base);"
	data-component="voice-card"
	title="Voice lets you talk to Clyffy using your microphone and hear her respond in her own voice"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Volume2 size={18} style="color: var(--accent-teal-main);" />
					<Text size="base" weight="bold" color="primary">Voice</Text>
				</div>
				<Text size="xs" color="muted">Talk to Clyffy</Text>
			</div>
			<Badge
				variant={voiceReady ? "positive" : "neutral"}
				size="sm"
			>
				{voiceReady ? "Ready" : "Setup needed"}
			</Badge>
		</div>

		<!-- Voice status indicators -->
		<VoiceSlotStatus
			sttActive={sttStatus === "loaded"}
			ttsActive={ttsStatus === "loaded"}
			micDetected={false}
		/>

		<!-- Listening section -->
		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			<div class={hstack({ justify: "between", align: "center" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Mic size={14} style="color: var(--text-muted);" />
					<Text size="sm" color="secondary">Listening: {sttReady ? "Standard" : "Not installed"}</Text>
				</div>
				{#if downloadingStt}
					<div class={hstack({ gap: "1", align: "center" })}>
						<Loader2 size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
						<Text size="xs" color="muted">{sttPct}%</Text>
					</div>
				{:else if sttStatus === "not_downloaded"}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={handleDownloadStt}
					>
						<Download size={10} />
						Install ({formatMb(sttSizeMb)})
					</button>
				{/if}
			</div>
		</div>

		<!-- Speaking section -->
		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			<div class={hstack({ justify: "between", align: "center" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Play size={14} style="color: var(--text-muted);" />
					<Text size="sm" color="secondary">Speaking: {ttsReady ? "Clyffy's voice" : "Not installed"}</Text>
				</div>
				{#if downloadingTts}
					<div class={hstack({ gap: "1", align: "center" })}>
						<Loader2 size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
						<Text size="xs" color="muted">{ttsPct}%</Text>
					</div>
				{:else if ttsStatus === "not_downloaded"}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={handleDownloadTts}
					>
						<Download size={10} />
						Install ({formatMb(ttsSizeMb)})
					</button>
				{/if}
			</div>
		</div>

		<!-- Voice settings -->
		<div class="flex flex-wrap gap-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="Changes how Clyffy sounds when she speaks — Default is natural, Casual is relaxed, Focused is precise">
				Voice style:
				<select
					bind:value={voiceStyle}
					class="rounded border px-2 py-0.5 text-xs"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				>
					<option value="default">Default</option>
					<option value="casual">Casual</option>
					<option value="focused">Focused</option>
				</select>
			</label>

			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="When on, you hold a key to talk. When off, Clyffy listens continuously.">
				<input
					type="checkbox"
					bind:checked={pushToTalk}
					class="accent-teal-500"
				/>
				Push-to-talk
			</label>

			<!-- Cross-link to full Voice Lab -->
			<button
				class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
				onclick={() => invoke("open_window", { label: "voice-lab" })}
				title="Open the full Voice Lab — test microphone, preview voices, manage voice profiles"
			>
				<ExternalLink size={10} />
				Voice Lab
			</button>
		</div>

		<!-- Advanced view -->
		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					STT: {STT_SLOT} ({sttStatus}) | TTS: {TTS_SLOT} ({ttsStatus}) | Profile: {voiceStyle}
				</Text>
			</div>
		{/if}

		<!-- Clyffy narration -->
		{#each [narrationState.forSlot(STT_SLOT), narrationState.forSlot(TTS_SLOT)] as msg}
			{#if msg}
				<div
					class="rounded-lg border-l-2 px-3 py-2 text-xs"
					style="background: oklch(0.15 0.02 185 / 0.3); border-color: var(--accent-teal-main); color: var(--text-secondary);"
				>
					{msg.text}
				</div>
			{/if}
		{/each}

		<!-- Error -->
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>

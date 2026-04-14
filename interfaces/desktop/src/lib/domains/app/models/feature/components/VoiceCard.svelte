<!--
  @file VoiceCard — "Talk to Clyffy" card for the consumer model loader.
  STT + TTS as one section. Mic selection. Voice preview. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Download, ExternalLink, Loader2, Mic, Play, Volume2, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
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
import VoiceSlotStatus from "../../ui/VoiceSlotStatus.svelte";
import {
	formatEta,
	formatMb,
	formatSpeed,
	slotDisplayStatus,
	statusColor,
	statusLabel,
} from "../../util/models.types.js";
import ModelPicker from "./ModelPicker.svelte";

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
let sttDownloadId = $state<string | null>(null);
let ttsDownloadId = $state<string | null>(null);
let sttPct = $state(0);
let ttsPct = $state(0);
let sttSpeedBps = $state(0);
let ttsSpeedBps = $state(0);
let sttEtaSecs = $state(-1);
let ttsEtaSecs = $state(-1);
let pushToTalk = $state(false);
let voiceStyle = $state<"default" | "casual" | "focused">("default");
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

const sttStatus = $derived(
	slotDisplayStatus(
		modelsState.statuses[STT_SLOT],
		!!modelsState.slots.find((s) => s.id === STT_SLOT)?.assigned_model_id,
	),
);
const ttsStatus = $derived(
	slotDisplayStatus(
		modelsState.statuses[TTS_SLOT],
		!!modelsState.slots.find((s) => s.id === TTS_SLOT)?.assigned_model_id,
	),
);
const sttReady = $derived(sttStatus === "active" || sttStatus === "downloaded");
const ttsReady = $derived(ttsStatus === "active" || ttsStatus === "downloaded");
const voiceReady = $derived(sttReady && ttsReady);
const sttCapability = $derived(
	modelsState.slots.find((s) => s.id === STT_SLOT)?.capability ?? "speech_to_text",
);
const ttsCapability = $derived(
	modelsState.slots.find((s) => s.id === TTS_SLOT)?.capability ?? "text_to_speech",
);
const sttModelStatus = $derived(modelsState.statuses[STT_SLOT]);
const ttsModelStatus = $derived(modelsState.statuses[TTS_SLOT]);
const sttTransitioning = $derived(
	sttModelStatus?.type === "loading" || sttModelStatus?.type === "unloading",
);
const ttsTransitioning = $derived(
	ttsModelStatus?.type === "loading" || ttsModelStatus?.type === "unloading",
);

// ── Actions ───────────────────────────────────────────────────

async function handleDownloadStt(): Promise<void> {
	error = null;
	downloadingStt = true;
	sttPct = 0;
	sttSpeedBps = 0;
	sttEtaSecs = -1;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			sttPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		sttSpeedBps = p.speedBps;
		sttEtaSecs = p.etaSecs;
		if (!sttDownloadId && p.downloadId) sttDownloadId = p.downloadId;
	});
	try {
		const id = await downloadModel(sttRepo, sttFile);
		sttDownloadId = id;
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
		sttDownloadId = null;
		unsub();
	}
}

async function handleCancelStt(): Promise<void> {
	if (!sttDownloadId) return;
	try {
		await cancelDownload(sttDownloadId);
		downloadingStt = false;
		sttDownloadId = null;
		sttPct = 0;
	} catch (e) {
		error = `Cancel failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleDownloadTts(): Promise<void> {
	error = null;
	downloadingTts = true;
	ttsPct = 0;
	ttsSpeedBps = 0;
	ttsEtaSecs = -1;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			ttsPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		ttsSpeedBps = p.speedBps;
		ttsEtaSecs = p.etaSecs;
		if (!ttsDownloadId && p.downloadId) ttsDownloadId = p.downloadId;
	});
	try {
		const id = await downloadModel(ttsRepo, ttsFile);
		ttsDownloadId = id;
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
		ttsDownloadId = null;
		unsub();
	}
}

async function handleCancelTts(): Promise<void> {
	if (!ttsDownloadId) return;
	try {
		await cancelDownload(ttsDownloadId);
		downloadingTts = false;
		ttsDownloadId = null;
		ttsPct = 0;
	} catch (e) {
		error = `Cancel failed: ${e instanceof Error ? e.message : String(e)}`;
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
			sttActive={sttStatus === "active"}
			ttsActive={ttsStatus === "active"}
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
						{#if sttSpeedBps > 0}
							<Text size="xs" color="muted">{formatSpeed(sttSpeedBps)}</Text>
						{/if}
						{#if sttEtaSecs >= 0}
							<Text size="xs" color="muted">{formatEta(sttEtaSecs)}</Text>
						{/if}
						<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={handleCancelStt} title="Cancel" aria-label="Cancel STT download">
							<X size={10} />
						</button>
					</div>
				{:else if sttStatus === "not_downloaded"}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={handleDownloadStt}
						disabled={sttTransitioning}
					>
						<Download size={10} />
						Install ({formatMb(sttSizeMb)})
					</button>
				{/if}
			</div>
			<ModelPicker
				slotId={STT_SLOT}
				capability={sttCapability}
				onAssign={() => { error = null; }}
			/>
			{#if sttTransitioning && sttModelStatus}
				<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
					<Loader2 size={12} class="animate-spin" style="color: {statusColor(sttModelStatus)};" />
					<Text size="xs" color="muted">{statusLabel(sttModelStatus)}</Text>
				</div>
			{/if}
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
						{#if ttsSpeedBps > 0}
							<Text size="xs" color="muted">{formatSpeed(ttsSpeedBps)}</Text>
						{/if}
						{#if ttsEtaSecs >= 0}
							<Text size="xs" color="muted">{formatEta(ttsEtaSecs)}</Text>
						{/if}
						<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={handleCancelTts} title="Cancel" aria-label="Cancel TTS download">
							<X size={10} />
						</button>
					</div>
				{:else if ttsStatus === "not_downloaded"}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={handleDownloadTts}
						disabled={ttsTransitioning}
					>
						<Download size={10} />
						Install ({formatMb(ttsSizeMb)})
					</button>
				{/if}
			</div>
			<ModelPicker
				slotId={TTS_SLOT}
				capability={ttsCapability}
				onAssign={() => { error = null; }}
			/>
			{#if ttsTransitioning && ttsModelStatus}
				<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
					<Loader2 size={12} class="animate-spin" style="color: {statusColor(ttsModelStatus)};" />
					<Text size="xs" color="muted">{statusLabel(ttsModelStatus)}</Text>
				</div>
			{/if}
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

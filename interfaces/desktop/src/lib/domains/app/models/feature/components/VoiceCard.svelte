<!--
  @file VoiceCard — "Talk to Clyffy" card for the consumer model loader.
  STT + TTS as one section. Mic selection. Voice preview. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Download, ExternalLink, Mic, Play, Sparkles, Volume2, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { logInfo } from "$lib/sys/logger.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { narrationState } from "../../data-access/narration.state.svelte.js";
import { setupWizardOverlayState } from "../../data-access/setup-wizard-overlay.state.svelte.js";
import { voiceCardState } from "../../data-access/voice-card.state.svelte.js";
import VoiceSlotStatus from "../../ui/VoiceSlotStatus.svelte";
import {
	formatEta,
	formatMb,
	formatSpeed,
	statusLabel,
	statusToTone,
} from "../../util/models.types.js";
import VoiceLabPanel from "../setup-wizard/panels/VoiceLabPanel.svelte";
import { wizardState } from "../setup-wizard/wizard.state.svelte.js";
import ModelPicker from "./ModelPicker.svelte";

interface Props {
	advanced?: boolean;
}

let { advanced = false }: Props = $props();
const voiceState = voiceCardState;
const overlayState = setupWizardOverlayState;
const cardM = $derived(renderForge({ kind: "voice-card", preset: "glass-elevated" }));

$effect(() => {
	void voiceState.ensureCatalogLoaded();
});

// ── Recommendation prefill (STT + TTS) ──────────────────
const sttRec = $derived(wizardState.recommendations.find((r) => r.slot === "voice.stt"));
const ttsRec = $derived(wizardState.recommendations.find((r) => r.slot === "voice.tts"));
const recIsActive = $derived(
	(sttRec !== undefined &&
		voiceState.committedModelId(voiceState.sttSlotId) === null &&
		voiceState.pendingModelId(voiceState.sttSlotId) === null) ||
		(ttsRec !== undefined &&
			voiceState.committedModelId(voiceState.ttsSlotId) === null &&
			voiceState.pendingModelId(voiceState.ttsSlotId) === null),
);

$effect(() => {
	for (const [rec, slot] of [
		[sttRec, voiceState.sttSlotId] as const,
		[ttsRec, voiceState.ttsSlotId] as const,
	]) {
		if (!rec || !rec.alreadyDownloaded) continue;
		if (voiceState.committedModelId(slot) || voiceState.pendingModelId(slot)) continue;
		const model = modelsState.models.find((m) => m.filename === rec.file);
		if (model && voiceState.selectedModelId(slot) !== model.id) {
			logInfo("voice-card", `prefill ${slot}=${model.id} from recommendation`);
			voiceState.selectModel(slot, model.id);
		}
	}
});

// ── STT language (auto / en / es / fr / de / ja / zh / ko / pt / ru / ar)
const STT_LANGUAGES: Array<{ value: string; label: string }> = [
	{ value: "auto", label: "Auto-detect" },
	{ value: "en", label: "English" },
	{ value: "es", label: "Spanish" },
	{ value: "fr", label: "French" },
	{ value: "de", label: "German" },
	{ value: "ja", label: "Japanese" },
	{ value: "zh", label: "Chinese" },
	{ value: "ko", label: "Korean" },
	{ value: "pt", label: "Portuguese" },
	{ value: "ru", label: "Russian" },
	{ value: "ar", label: "Arabic" },
];

async function handleSttLanguageChange(e: Event): Promise<void> {
	const next = (e.currentTarget as HTMLSelectElement).value;
	logInfo("voice-card", `STT language change → ${next}`);
	await overlayState.saveSttLanguage(next);
}

// ── Voice Lab modal (custom voice clone training) ──
let showVoiceLab = $state(false);
function openVoiceLab(): void {
	logInfo("voice-card", "openVoiceLab()");
	showVoiceLab = true;
}
function closeVoiceLab(): void {
	logInfo("voice-card", "closeVoiceLab()");
	showVoiceLab = false;
}
</script>

<div
	{...cardM.dataAttrs}
	style="{cssVarString(cardM.cssVars)} border-left: 3px solid var(--accent-coral-main); box-shadow: 0 0 0 1px var(--accent-coral-fill);"
	class="rounded-xl p-5 transition-all"
	data-component="voice-card"
	data-role="voice"
	title="Voice lets you talk to Clyffy using your microphone and hear her respond in her own voice"
>
	<div class={stack({ gap: "3" })}>
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Volume2 size={18} style="color: var(--accent-teal-main);" />
					<Text size="base" weight="bold" color="primary">Voice</Text>
					{#if recIsActive}
						<Badge variant="informative" size="sm" title="Pre-filled from your model plan">
							<Sparkles size={10} />
							Recommended
						</Badge>
					{:else if sttRec || ttsRec}
						<Badge variant="neutral" size="sm" title="You overrode the recommendation">
							Custom pick
						</Badge>
					{/if}
				</div>
				<Text size="xs" color="muted">Talk to Clyffy</Text>
			</div>
			<Badge variant={voiceState.voiceReady ? "positive" : "neutral"} size="sm">
				{voiceState.voiceReady ? "Ready" : "Setup needed"}
			</Badge>
		</div>

		<VoiceSlotStatus
			sttActive={voiceState.sttStatus === "active"}
			ttsActive={voiceState.ttsStatus === "active"}
			micDetected={false}
		/>

		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			<div class={hstack({ justify: "between", align: "center" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Mic size={14} style="color: var(--text-muted);" />
					<Text size="sm" color="secondary">Listening: {voiceState.sttReady ? "Standard" : "Not installed"}</Text>
				</div>
				{#if voiceState.downloadingStt}
					<div class={hstack({ gap: "1", align: "center" })}>
						<Spinner size="xs" tone="accent" />
						<Text size="xs" color="muted">{voiceState.sttPct}%</Text>
						{#if voiceState.sttSpeedBps > 0}
							<Text size="xs" color="muted">{formatSpeed(voiceState.sttSpeedBps)}</Text>
						{/if}
						{#if voiceState.sttEtaSecs >= 0}
							<Text size="xs" color="muted">{formatEta(voiceState.sttEtaSecs)}</Text>
						{/if}
						<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={() => voiceState.handleCancelStt()} title="Cancel" aria-label="Cancel STT download">
							<X size={10} />
						</button>
					</div>
				{:else if voiceState.sttStatus === "not_downloaded"}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={() => voiceState.handleDownloadStt()}
						disabled={voiceState.sttTransitioning}
					>
						<Download size={10} />
						Install ({formatMb(voiceState.sttSizeMb)})
					</button>
				{/if}
			</div>
			<ModelPicker
				models={voiceState.sttModels}
				selectedModelId={voiceState.selectedModelId(voiceState.sttSlotId)}
				committedModelId={voiceState.committedModelId(voiceState.sttSlotId)}
				pendingModelId={voiceState.pendingModelId(voiceState.sttSlotId)}
				onSelect={(modelId) => voiceState.selectModel(voiceState.sttSlotId, modelId)}
			/>
			<label
				class="mt-2 flex items-center gap-2 text-sm"
				style="color: var(--text-secondary);"
				title="Tells the speech recognizer which language to expect — Auto-detect works for most languages but pinning improves accuracy"
			>
				Language:
				<select
					value={overlayState.sttLanguage}
					onchange={handleSttLanguageChange}
					class="rounded border px-2 py-0.5 text-xs"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
					aria-label="Speech-to-text language"
				>
					{#each STT_LANGUAGES as lang (lang.value)}
						<option value={lang.value}>{lang.label}</option>
					{/each}
				</select>
			</label>
			{#if voiceState.sttTransitioning && voiceState.sttModelStatus}
				<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
					<Spinner size="xs" tone={statusToTone(voiceState.sttModelStatus)} />
					<Text size="xs" color="muted">{statusLabel(voiceState.sttModelStatus)}</Text>
				</div>
			{/if}
		</div>

		<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
			<div class={hstack({ justify: "between", align: "center" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Play size={14} style="color: var(--text-muted);" />
					<Text size="sm" color="secondary">Speaking: {voiceState.ttsReady ? "Clyffy's voice" : "Not installed"}</Text>
				</div>
				{#if voiceState.downloadingTts}
					<div class={hstack({ gap: "1", align: "center" })}>
						<Spinner size="xs" tone="accent" />
						<Text size="xs" color="muted">{voiceState.ttsPct}%</Text>
						{#if voiceState.ttsSpeedBps > 0}
							<Text size="xs" color="muted">{formatSpeed(voiceState.ttsSpeedBps)}</Text>
						{/if}
						{#if voiceState.ttsEtaSecs >= 0}
							<Text size="xs" color="muted">{formatEta(voiceState.ttsEtaSecs)}</Text>
						{/if}
						<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={() => voiceState.handleCancelTts()} title="Cancel" aria-label="Cancel TTS download">
							<X size={10} />
						</button>
					</div>
				{:else if voiceState.ttsStatus === "not_downloaded"}
					<button
						class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base);"
						onclick={() => voiceState.handleDownloadTts()}
						disabled={voiceState.ttsTransitioning}
					>
						<Download size={10} />
						Install ({formatMb(voiceState.ttsSizeMb)})
					</button>
				{/if}
			</div>
			<ModelPicker
				models={voiceState.ttsModels}
				selectedModelId={voiceState.selectedModelId(voiceState.ttsSlotId)}
				committedModelId={voiceState.committedModelId(voiceState.ttsSlotId)}
				pendingModelId={voiceState.pendingModelId(voiceState.ttsSlotId)}
				onSelect={(modelId) => voiceState.selectModel(voiceState.ttsSlotId, modelId)}
			/>
			{#if voiceState.ttsTransitioning && voiceState.ttsModelStatus}
				<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
					<Spinner size="xs" tone={statusToTone(voiceState.ttsModelStatus)} />
					<Text size="xs" color="muted">{statusLabel(voiceState.ttsModelStatus)}</Text>
				</div>
			{/if}
		</div>

		<div class="flex flex-wrap gap-4">
			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="Changes how Clyffy sounds when she speaks — Default is natural, Casual is relaxed, Focused is precise">
				Voice style:
				<select
					bind:value={voiceState.voiceStyle}
					class="rounded border px-2 py-0.5 text-xs"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				>
					<option value="default">Default</option>
					<option value="casual">Casual</option>
					<option value="focused">Focused</option>
				</select>
			</label>

			<label class="flex items-center gap-2 text-sm" style="color: var(--text-secondary);" title="When on, you hold a key to talk. When off, Clyffy listens continuously.">
				<input type="checkbox" bind:checked={voiceState.pushToTalk} class="accent-teal-500" />
				Push-to-talk
			</label>

			<button
				class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:brightness-110"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-secondary);"
				onclick={openVoiceLab}
				title="Upload a 5-30s voice sample and have Clyffy speak in that voice"
			>
				<Mic size={10} />
				Customize voice
			</button>
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

		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					STT: {voiceState.sttSlotId} ({voiceState.sttStatus}) | TTS: {voiceState.ttsSlotId} ({voiceState.ttsStatus}) | Profile: {voiceState.voiceStyle}
				</Text>
			</div>
		{/if}

		{#each [narrationState.forSlot(voiceState.sttSlotId), narrationState.forSlot(voiceState.ttsSlotId)] as msg}
			{#if msg}
				<div
					class="rounded-lg border-l-2 px-3 py-2 text-xs"
					style="background: oklch(0.15 0.02 185 / 0.3); border-color: var(--accent-teal-main); color: var(--text-secondary);"
				>
					{msg.text}
				</div>
			{/if}
		{/each}

		{#if voiceState.error}
			<Text size="xs" color="negative">{voiceState.error}</Text>
		{/if}
	</div>
</div>

{#if showVoiceLab}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="vc-lab-backdrop"
		onclick={closeVoiceLab}
		onkeydown={(e) => e.key === "Escape" && closeVoiceLab()}
	>
		<div
			class="vc-lab-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Customize voice"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="vc-lab-head">
				<Text size="sm" weight="bold">Customize voice</Text>
				<button
					type="button"
					class="vc-lab-close"
					onclick={closeVoiceLab}
					aria-label="Close customize voice"
				>
					<X size={14} />
				</button>
			</div>
			<div class="vc-lab-body">
				<VoiceLabPanel />
			</div>
		</div>
	</div>
{/if}

<style>
	.vc-lab-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: oklch(0 0 0 / 0.6);
		backdrop-filter: blur(0.5rem);
	}
	.vc-lab-panel {
		display: flex;
		flex-direction: column;
		width: min(46rem, 92vw);
		max-height: 88vh;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
		border-radius: 1rem;
		box-shadow: var(--shadow-z3);
		overflow: hidden;
	}
	.vc-lab-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-soft);
	}
	.vc-lab-close {
		background: transparent;
		border: 1px solid var(--border-soft);
		color: var(--text-muted);
		border-radius: 0.375rem;
		padding: 0.25rem;
		cursor: pointer;
		transition: color 150ms ease-out, border-color 150ms ease-out;
	}
	.vc-lab-close:hover {
		color: var(--text-primary);
		border-color: var(--text-secondary);
	}
	.vc-lab-body {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}
</style>

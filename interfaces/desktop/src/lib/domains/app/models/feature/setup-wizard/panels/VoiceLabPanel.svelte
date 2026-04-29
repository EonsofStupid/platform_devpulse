<!--
  @file VoiceLabPanel.svelte
  @domain models/setup-wizard/panels

  Voice training + custom voice upload — the wizard surface that
  absorbs the archived `VoiceLabPanel` capability without forcing
  the user to open the standalone Voice Lab window.

  Capabilities:
    1. Pick an audio file via the native file picker
       (`commands.pickAudioFile`).
    2. Upload + transcribe via `commands.uploadVoiceSample` —
       returns the on-disk path plus a best-effort transcript.
    3. Optionally edit the transcript, then register the clone via
       `commands.registerVoiceClone` so the TTS slot can use it.
    4. Preview an existing voice via `commands.previewVoice`.
    5. Remove a registered clone via `commands.removeVoiceClone`.

  All IPC is wrapped in `withAction`. Failures surface as inline
  copy — never a thrown exception.
-->
<script lang="ts">
import { CheckCircle, Mic, PlayCircle, Trash2, Upload, Volume2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import { commands, type VoiceInfo } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

const LOG_TARGET = "wizard.voice-lab";
const TTS_SLOT = "voice.tts";

let voices = $state<VoiceInfo[]>([]);
let loadingVoices = $state(true);

let cloneName = $state("");
let cloneTranscript = $state("");
let pickedPath = $state<string | null>(null);
let suggestedTranscript = $state<string | null>(null);

let pickingAudio = $state(false);
let uploading = $state(false);
let registering = $state(false);
let previewing = $state<string | null>(null);
let removing = $state<string | null>(null);

let banner = $state<{ tone: "success" | "error"; message: string } | null>(null);

$effect(() => {
	void loadVoices();
});

async function loadVoices(): Promise<void> {
	loadingVoices = true;
	logInfo(LOG_TARGET, "loadVoices() → commands.listVoices(voice.tts)");
	try {
		const result = await commands.listVoices(TTS_SLOT);
		if (result.status === "ok") {
			voices = result.data;
			logInfo(LOG_TARGET, `loadVoices() DONE — ${voices.length} voices`);
		} else {
			banner = { tone: "error", message: `Couldn't list voices: ${result.error}` };
			logError(LOG_TARGET, `loadVoices() FAILED: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		banner = { tone: "error", message: `Couldn't list voices: ${msg}` };
		logError(LOG_TARGET, `loadVoices() threw: ${msg}`);
	} finally {
		loadingVoices = false;
	}
}

async function handlePickAudio(): Promise<void> {
	if (pickingAudio) return;
	pickingAudio = true;
	banner = null;
	logInfo(LOG_TARGET, "handlePickAudio()");
	try {
		const result = await commands.pickAudioFile("Pick a 5-30 second voice sample");
		if (result.status === "ok") {
			if (result.data) {
				pickedPath = result.data;
				logInfo(LOG_TARGET, `handlePickAudio() picked=${pickedPath}`);
			}
		} else {
			banner = { tone: "error", message: result.error };
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		if (!msg.includes("cancelled") && !msg.includes("No file")) {
			banner = { tone: "error", message: msg };
			logError(LOG_TARGET, `handlePickAudio() threw: ${msg}`);
		}
	} finally {
		pickingAudio = false;
	}
}

async function handleUpload(): Promise<void> {
	if (!cloneName.trim() || !pickedPath || uploading) return;
	uploading = true;
	banner = null;
	const name = cloneName.trim();
	const sourcePath = pickedPath;
	logInfo(LOG_TARGET, `handleUpload(${name}, ${sourcePath})`);
	try {
		const result = await withAction(
			"wizard.uploadVoiceSample",
			"Uploading and transcribing your voice sample…",
			async () => commands.uploadVoiceSample(name, sourcePath),
		);
		if (result.status === "ok") {
			pickedPath = result.data.path;
			suggestedTranscript = result.data.suggested_transcript;
			cloneTranscript = result.data.suggested_transcript;
			banner = {
				tone: "success",
				message:
					result.data.suggested_transcript.length > 0
						? "Sample uploaded and transcribed. Edit the transcript if needed, then register."
						: "Sample uploaded. STT didn't transcribe automatically — fill in the transcript manually.",
			};
			logInfo(LOG_TARGET, "handleUpload() DONE");
		} else {
			banner = { tone: "error", message: result.error };
			logError(LOG_TARGET, `handleUpload() FAILED: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		banner = { tone: "error", message: msg };
		logError(LOG_TARGET, `handleUpload() threw: ${msg}`);
	} finally {
		uploading = false;
	}
}

async function handleRegister(): Promise<void> {
	if (!cloneName.trim() || !pickedPath || registering) return;
	registering = true;
	banner = null;
	const entry = {
		name: cloneName.trim(),
		reference_path: pickedPath,
		transcript: cloneTranscript.trim().length > 0 ? cloneTranscript.trim() : undefined,
	};
	logInfo(LOG_TARGET, `handleRegister(${entry.name})`);
	try {
		const result = await withAction(
			"wizard.registerVoiceClone",
			"Registering your custom voice…",
			async () => commands.registerVoiceClone(entry),
		);
		if (result.status === "ok") {
			banner = {
				tone: "success",
				message: `Custom voice "${entry.name}" registered. It now appears in the voices list.`,
			};
			cloneName = "";
			cloneTranscript = "";
			pickedPath = null;
			suggestedTranscript = null;
			logInfo(LOG_TARGET, "handleRegister() DONE");
			await loadVoices();
		} else {
			banner = { tone: "error", message: result.error };
			logError(LOG_TARGET, `handleRegister() FAILED: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		banner = { tone: "error", message: msg };
		logError(LOG_TARGET, `handleRegister() threw: ${msg}`);
	} finally {
		registering = false;
	}
}

async function handlePreview(voiceId: string): Promise<void> {
	if (previewing) return;
	previewing = voiceId;
	banner = null;
	logInfo(LOG_TARGET, `handlePreview(${voiceId})`);
	try {
		const result = await withAction("wizard.previewVoice", "Playing the voice preview…", async () =>
			commands.previewVoice(voiceId, TTS_SLOT),
		);
		if (result.status === "error") {
			banner = { tone: "error", message: result.error };
			logError(LOG_TARGET, `handlePreview(${voiceId}) FAILED: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		banner = { tone: "error", message: msg };
		logError(LOG_TARGET, `handlePreview(${voiceId}) threw: ${msg}`);
	} finally {
		previewing = null;
	}
}

async function handleRemove(name: string): Promise<void> {
	if (removing) return;
	removing = name;
	banner = null;
	logInfo(LOG_TARGET, `handleRemove(${name})`);
	try {
		const result = await withAction(
			"wizard.removeVoiceClone",
			"Removing the custom voice…",
			async () => commands.removeVoiceClone(name),
		);
		if (result.status === "ok") {
			banner = { tone: "success", message: `Removed "${name}".` };
			logInfo(LOG_TARGET, `handleRemove(${name}) DONE`);
			await loadVoices();
		} else {
			banner = { tone: "error", message: result.error };
			logError(LOG_TARGET, `handleRemove(${name}) FAILED: ${result.error}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		banner = { tone: "error", message: msg };
		logError(LOG_TARGET, `handleRemove(${name}) threw: ${msg}`);
	} finally {
		removing = null;
	}
}

// The VoiceInfo wire type doesn't expose a custom-vs-stock flag — registry
// returns one flat list — so we render a single section. The `removeVoiceClone`
// command silently no-ops on stock voices, but rather than hand the user
// a button that won't work, we hide the remove control unless the engine
// id is `custom` (Kokoro convention for user-registered clones).
function isCustom(v: VoiceInfo): boolean {
	return v.engine === "custom";
}
</script>

<div class="vl-panel">
	<div class="vl-head">
		<div class="vl-head-icon"><Volume2 size={18} /></div>
		<div class="vl-head-text">
			<Heading level={3} size="sm">Custom voices</Heading>
			<Text size="xs" color="muted">
				Upload a 5–30 second sample and Clyffy will speak in that voice. Sample stays on
				your machine.
			</Text>
		</div>
	</div>

	{#if banner}
		<div class="vl-banner" class:vl-banner-error={banner.tone === "error"} role="status">
			<Text size="xs">{banner.message}</Text>
		</div>
	{/if}

	<!-- Upload + register form -->
	<div class="vl-form">
		<div class="vl-field">
			<label for="vl-clone-name" class="vl-label">
				<Text size="xs" weight="bold">Name your voice</Text>
			</label>
			<input
				id="vl-clone-name"
				type="text"
				class="vl-input"
				placeholder="e.g. my-narrator"
				bind:value={cloneName}
				maxlength={48}
			/>
		</div>

		<div class="vl-field">
			<Text size="xs" weight="bold">Audio sample</Text>
			<div class="vl-row">
				<input
					type="text"
					class="vl-input vl-input-readonly"
					value={pickedPath ?? ""}
					readonly
					placeholder="Click Pick to choose an MP3, WAV, or FLAC file"
				/>
				<Button
					preset="button-secondary"
					size="sm"
					onclick={handlePickAudio}
					disabled={pickingAudio}
				>
					{#if pickingAudio}
						<Spinner size="xs" />
					{:else}
						<Upload size={14} />
					{/if}
					Pick
				</Button>
			</div>
		</div>

		{#if pickedPath}
			<div class="vl-field">
				<label for="vl-clone-transcript" class="vl-label">
					<Text size="xs" weight="bold">Transcript</Text>
					<Text size="xs" color="muted">
						{suggestedTranscript === null
							? "Click Upload to transcribe automatically, or type the transcript yourself."
							: suggestedTranscript.length > 0
								? "STT pre-filled this — edit if needed."
								: "STT couldn't transcribe — please type what's said in the sample."}
					</Text>
				</label>
				<textarea
					id="vl-clone-transcript"
					class="vl-textarea"
					rows={2}
					placeholder="Type the words spoken in the sample"
					bind:value={cloneTranscript}
				></textarea>
			</div>
		{/if}

		<div class="vl-actions">
			<Button
				preset="button-secondary"
				size="sm"
				onclick={handleUpload}
				disabled={!cloneName.trim() || !pickedPath || uploading}
			>
				{#if uploading}
					<Spinner size="xs" />
					Uploading…
				{:else}
					<Mic size={14} />
					Upload + transcribe
				{/if}
			</Button>
			<Button
				preset="button-primary"
				size="sm"
				onclick={handleRegister}
				disabled={!cloneName.trim() || !pickedPath || registering}
			>
				{#if registering}
					<Spinner size="xs" />
					Registering…
				{:else}
					<CheckCircle size={14} />
					Register voice
				{/if}
			</Button>
		</div>
	</div>

	<!-- Voice list -->
	<div class="vl-section">
		<Text size="xs" weight="bold" color="muted" class="vl-section-title">Available voices</Text>

		{#if loadingVoices}
			<div class="vl-loading">
				<Spinner size="sm" />
				<Text size="xs" color="muted">Loading voices…</Text>
			</div>
		{:else if voices.length === 0}
			<Text size="xs" color="muted">
				No voices registered yet. Upload a sample above to add one.
			</Text>
		{:else}
			<ul class="vl-voice-list">
				{#each voices as v (v.id)}
					{@const custom = isCustom(v)}
					<li class="vl-voice-row">
						<div class="vl-voice-info">
							<Text size="xs" weight="bold">{v.label}</Text>
							<Text size="xs" color="muted">{v.id} · {v.engine}</Text>
						</div>
						{#if custom}
							<Badge tone="positive" size="sm">Custom</Badge>
						{/if}
						<Button
							preset="button-ghost"
							size="sm"
							onclick={() => void handlePreview(v.id)}
							disabled={previewing === v.id}
							aria-label="Preview {v.label}"
						>
							{#if previewing === v.id}
								<Spinner size="xs" />
							{:else}
								<PlayCircle size={14} />
							{/if}
						</Button>
						{#if custom}
							<Button
								preset="button-ghost"
								size="sm"
								onclick={() => void handleRemove(v.id)}
								disabled={removing === v.id}
								aria-label="Remove {v.label}"
							>
								{#if removing === v.id}
									<Spinner size="xs" />
								{:else}
									<Trash2 size={14} />
								{/if}
							</Button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.vl-panel {
		display: flex;
		flex-direction: column;
		gap: clamp(0.625rem, 1.25vw, 0.875rem);
	}

	.vl-head {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}
	.vl-head-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--wizard-role-voice-main) 25%, transparent);
		color: var(--wizard-role-voice-main);
		flex-shrink: 0;
	}
	.vl-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.vl-banner {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--signal-success) 12%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-success) 30%, transparent);
		color: var(--signal-success);
	}
	.vl-banner-error {
		background: color-mix(in oklch, var(--signal-error) 12%, transparent);
		border-color: color-mix(in oklch, var(--signal-error) 35%, transparent);
		color: var(--signal-error);
	}

	.vl-form {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.75rem 0.875rem;
		border-radius: 0.625rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
	}

	.vl-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.vl-label {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.vl-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-base);
		color: var(--text-primary);
		font-size: 0.8125rem;
		outline: none;
		transition: border-color 150ms ease-out;
	}
	.vl-input:focus {
		border-color: var(--accent-teal-main);
	}
	.vl-input::placeholder {
		color: var(--text-muted);
	}
	.vl-input-readonly {
		flex: 1;
		min-width: 0;
		cursor: default;
	}

	.vl-textarea {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-base);
		color: var(--text-primary);
		font-size: 0.8125rem;
		outline: none;
		font-family: inherit;
		resize: vertical;
		transition: border-color 150ms ease-out;
	}
	.vl-textarea:focus {
		border-color: var(--accent-teal-main);
	}

	.vl-row {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.vl-actions {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.vl-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	:global(.vl-section-title) {
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.vl-loading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		padding: 0.5rem;
	}

	.vl-voice-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
	}

	.vl-voice-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
	}

	.vl-voice-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}
</style>

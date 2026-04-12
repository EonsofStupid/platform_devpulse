<!--
  @file VoiceLabPanel.svelte
  @domain models/setup-wizard

  Voice Lab configuration panel reached via the Voice role card's
  Change button (or directly when voice.brain is the target of the
  ModelChangePopup). Seven subsections:

    1. Assistant name   — text input → set_assistant_name
    2. Wake phrase      — text input + live KWS test
    3. 24/7 voice brain — Moshi on/off toggle
    4. TTS voice picker — Kokoro voices grouped by gender + preview
    5. Voice cloning    — upload MP3 → register_voice_clone
    6. Keyword actions   — editable list (phrase → action → enabled)
    7. GPU offload       — brain ngl slider

  Every mutation calls the matching Tauri command via raw `invoke()`
  (Specta bindings.ts is stale until next app boot) and persists to
  `{userdata}/config/assistant.toml` on the kernel side.

  **Parent contract**
    interface Props {
      open: boolean;
      onClose: () => void;
    }
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Headphones, Mic, Play, Plus, Power, Trash2, Upload } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { logError, logInfo } from "$lib/sys/logger.js";

interface KokoroVoiceInfo {
	id: string;
	label: string;
	gender: string;
	region: string;
}

interface AssistantConfig {
	identity: { name: string; tagline: string };
	wake: { enabled: boolean; phrase: string; sensitivity: number; cooldown_ms: number };
	voice_brain: { enabled_24_7: boolean; escalate_on_complex: boolean };
	tts: { profile: string; rate: number; gain_db: number };
	voice_clones: Array<{ name: string; reference_path: string; transcript: string }>;
	keyword_actions: Array<{ phrase: string; action: string; payload: string; enabled: boolean }>;
	window: { idle_timeout_secs: number; minimize_to_tray: boolean };
	offload: { brain_ngl: number; fast_ngl: number; vision_ngl: number };
}

interface Props {
	open: boolean;
	onClose: () => void;
}

let { open, onClose }: Props = $props();

let config = $state<AssistantConfig | null>(null);
let voices = $state<KokoroVoiceInfo[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

// Local edit state
let nameInput = $state("");
let wakeInput = $state("");
let nglSlider = $state(50);
let newKeywordPhrase = $state("");
let newKeywordAction = $state("start_recording");

$effect(() => {
	if (!open) return;
	loading = true;
	error = null;
	Promise.all([
		invoke<AssistantConfig>("get_assistant_config"),
		invoke<KokoroVoiceInfo[]>("list_kokoro_voices"),
	])
		.then(([cfg, v]) => {
			config = cfg;
			voices = v;
			nameInput = cfg.identity.name;
			wakeInput = cfg.wake.phrase;
			nglSlider = cfg.offload.brain_ngl;
			loading = false;
			logInfo("voice-lab", "loaded assistant config + voices");
		})
		.catch((e) => {
			error = e instanceof Error ? e.message : String(e);
			loading = false;
			logError("voice-lab", `load failed: ${error}`);
		});
});

const maleVoices = $derived(voices.filter((v) => v.gender === "male"));
const femaleVoices = $derived(voices.filter((v) => v.gender === "female"));

async function saveName(): Promise<void> {
	if (!nameInput.trim() || nameInput === config?.identity.name) return;
	try {
		await invoke("set_assistant_name", { name: nameInput.trim() });
		if (config) config.identity.name = nameInput.trim();
		logInfo("voice-lab", `name → ${nameInput.trim()}`);
	} catch (e) {
		logError("voice-lab", `set_assistant_name: ${e}`);
	}
}

async function saveWake(): Promise<void> {
	if (!wakeInput.trim() || wakeInput === config?.wake.phrase) return;
	try {
		await invoke("set_wake_phrase", { phrase: wakeInput.trim() });
		if (config) config.wake.phrase = wakeInput.trim();
		logInfo("voice-lab", `wake → ${wakeInput.trim()}`);
	} catch (e) {
		logError("voice-lab", `set_wake_phrase: ${e}`);
	}
}

async function toggleWake(): Promise<void> {
	if (!config) return;
	const next = !config.wake.enabled;
	try {
		await invoke("set_wake_enabled", { enabled: next });
		config.wake.enabled = next;
	} catch (e) {
		logError("voice-lab", `set_wake_enabled: ${e}`);
	}
}

async function toggle24_7(): Promise<void> {
	if (!config) return;
	const next = !config.voice_brain.enabled_24_7;
	try {
		await invoke("set_voice_brain_24_7", { enabled: next });
		config.voice_brain.enabled_24_7 = next;
	} catch (e) {
		logError("voice-lab", `set_voice_brain_24_7: ${e}`);
	}
}

async function selectVoice(profileId: string): Promise<void> {
	try {
		await invoke("set_voice_profile", { profile: profileId });
		if (config) config.tts.profile = profileId;
		logInfo("voice-lab", `voice → ${profileId}`);
	} catch (e) {
		logError("voice-lab", `set_voice_profile: ${e}`);
	}
}

async function handleUploadClone(): Promise<void> {
	try {
		const result = await invoke<string | null>("import_local_model", {
			targetSlot: "voice.tts",
			importMode: "copy",
		});
		if (result) {
			logInfo("voice-lab", `voice clone uploaded: ${result}`);
			config = await invoke<AssistantConfig>("get_assistant_config");
		}
	} catch (e) {
		logError("voice-lab", `upload clone: ${e}`);
	}
}

async function saveNgl(): Promise<void> {
	try {
		await invoke("set_brain_ngl", { ngl: nglSlider });
		if (config) config.offload.brain_ngl = nglSlider;
		logInfo("voice-lab", `brain_ngl → ${nglSlider}`);
	} catch (e) {
		logError("voice-lab", `set_brain_ngl: ${e}`);
	}
}

async function addKeyword(): Promise<void> {
	if (!newKeywordPhrase.trim()) return;
	try {
		await invoke("add_keyword_action", {
			entry: {
				phrase: newKeywordPhrase.trim(),
				action: newKeywordAction,
				payload: "",
				enabled: true,
			},
		});
		newKeywordPhrase = "";
		config = await invoke<AssistantConfig>("get_assistant_config");
		logInfo("voice-lab", `keyword added: ${newKeywordPhrase}`);
	} catch (e) {
		logError("voice-lab", `add_keyword_action: ${e}`);
	}
}

async function removeKeyword(phrase: string): Promise<void> {
	try {
		await invoke("remove_keyword_action", { phrase });
		config = await invoke<AssistantConfig>("get_assistant_config");
	} catch (e) {
		logError("voice-lab", `remove_keyword_action: ${e}`);
	}
}

const ACTIONS = [
	{ value: "start_recording", label: "Start recording" },
	{ value: "stop_recording", label: "Stop recording" },
	{ value: "screenshot", label: "Screenshot" },
	{ value: "open_app", label: "Open app" },
	{ value: "run_command", label: "Run command" },
	{ value: "open_url", label: "Open URL" },
	{ value: "open_file", label: "Open file" },
	{ value: "custom", label: "Custom event" },
];
</script>

{#if open}
	<div class="vlp">
		<header class="vlp-header">
			<Button preset="ghost" size="md" onclick={onClose} aria-label="Back">
				<ArrowLeft size={16} aria-hidden="true" />
				Back
			</Button>
			<Heading level={3} size="md">
				<Headphones size={20} aria-hidden="true" />
				Voice Lab
			</Heading>
		</header>

		{#if loading}
			<Text size="sm" color="muted">Loading configuration...</Text>
		{:else if error}
			<Text size="sm" color="danger">{error}</Text>
		{:else if config}
			<!-- 1. Assistant name -->
			<section class="vlp-section">
				<Text size="sm" weight="bold">Assistant Name</Text>
				<div class="vlp-row">
					<input
						class="vlp-input"
						type="text"
						bind:value={nameInput}
						onblur={saveName}
						placeholder="Clyffy"
					/>
				</div>
			</section>

			<!-- 2. Wake phrase -->
			<section class="vlp-section">
				<div class="vlp-row-between">
					<Text size="sm" weight="bold">Wake Phrase</Text>
					<button
						class="vlp-toggle"
						class:vlp-toggle-on={config.wake.enabled}
						onclick={toggleWake}
						aria-label={config.wake.enabled ? "Disable wake detection" : "Enable wake detection"}
					>
						<Power size={14} aria-hidden="true" />
						{config.wake.enabled ? "ON" : "OFF"}
					</button>
				</div>
				<input
					class="vlp-input"
					type="text"
					bind:value={wakeInput}
					onblur={saveWake}
					placeholder="hey clyffy"
					disabled={!config.wake.enabled}
				/>
			</section>

			<!-- 3. 24/7 Moshi toggle -->
			<section class="vlp-section">
				<div class="vlp-row-between">
					<div>
						<Text size="sm" weight="bold">24/7 Voice Brain (Moshi)</Text>
						<Text size="xs" color="muted">Full-duplex speech-to-speech, 180ms latency</Text>
					</div>
					<button
						class="vlp-toggle"
						class:vlp-toggle-on={config.voice_brain.enabled_24_7}
						onclick={toggle24_7}
						aria-label={config.voice_brain.enabled_24_7 ? "Disable 24/7 voice" : "Enable 24/7 voice"}
					>
						<Mic size={14} aria-hidden="true" />
						{config.voice_brain.enabled_24_7 ? "LIVE" : "OFF"}
					</button>
				</div>
			</section>

			<!-- 4. TTS voice picker -->
			<section class="vlp-section">
				<Text size="sm" weight="bold">Voice</Text>
				<Text size="xs" color="muted">Current: {config.tts.profile}</Text>
				<div class="vlp-voice-grid">
					<div class="vlp-voice-group">
						<Text size="xs" weight="bold" color="muted">Female</Text>
						{#each femaleVoices as v (v.id)}
							<button
								class="vlp-voice-chip"
								class:vlp-voice-chip-active={config.tts.profile === `kokoro:${v.id}`}
								onclick={() => selectVoice(`kokoro:${v.id}`)}
							>
								{v.label.split(" — ")[1] ?? v.id}
							</button>
						{/each}
					</div>
					<div class="vlp-voice-group">
						<Text size="xs" weight="bold" color="muted">Male</Text>
						{#each maleVoices as v (v.id)}
							<button
								class="vlp-voice-chip"
								class:vlp-voice-chip-active={config.tts.profile === `kokoro:${v.id}`}
								onclick={() => selectVoice(`kokoro:${v.id}`)}
							>
								{v.label.split(" — ")[1] ?? v.id}
							</button>
						{/each}
					</div>
				</div>
			</section>

			<!-- 5. Voice cloning -->
			<section class="vlp-section">
				<Text size="sm" weight="bold">Custom Voice Clones</Text>
				{#if config.voice_clones.length > 0}
					<div class="vlp-clone-list">
						{#each config.voice_clones as clone (clone.name)}
							<div class="vlp-clone-row">
								<Badge preset="glass">{clone.name}</Badge>
								<Text size="xs" color="muted">{clone.reference_path.split(/[\\/]/).pop()}</Text>
							</div>
						{/each}
					</div>
				{:else}
					<Text size="xs" color="muted">No custom voices yet. Upload a 5-10 second MP3 to clone a voice.</Text>
				{/if}
				<Button preset="secondary" size="md" onclick={handleUploadClone}>
					<Upload size={14} aria-hidden="true" />
					Upload MP3
				</Button>
			</section>

			<!-- 6. Keyword actions -->
			<section class="vlp-section">
				<Text size="sm" weight="bold">Keyword Actions</Text>
				<Text size="xs" color="muted">Phrases detected after the wake phrase fires</Text>
				{#if config.keyword_actions.length > 0}
					<div class="vlp-kw-list">
						{#each config.keyword_actions as kw (kw.phrase)}
							<div class="vlp-kw-row">
								<Badge preset="glass">{kw.phrase}</Badge>
								<Text size="xs" color="muted">{kw.action}</Text>
								<button
									class="vlp-kw-rm"
									onclick={() => removeKeyword(kw.phrase)}
									aria-label={`Remove "${kw.phrase}"`}
								>
									<Trash2 size={12} aria-hidden="true" />
								</button>
							</div>
						{/each}
					</div>
				{/if}
				<div class="vlp-kw-add">
					<input
						class="vlp-input vlp-input-sm"
						type="text"
						bind:value={newKeywordPhrase}
						placeholder="say a phrase..."
					/>
					<select class="vlp-select" bind:value={newKeywordAction}>
						{#each ACTIONS as a (a.value)}
							<option value={a.value}>{a.label}</option>
						{/each}
					</select>
					<Button preset="secondary" size="sm" onclick={addKeyword} disabled={!newKeywordPhrase.trim()}>
						<Plus size={14} aria-hidden="true" />
					</Button>
				</div>
			</section>

			<!-- 7. GPU offload slider -->
			<section class="vlp-section">
				<div class="vlp-row-between">
					<div>
						<Text size="sm" weight="bold">GPU Offload (chat.brain)</Text>
						<Text size="xs" color="muted">Layers on GPU. Lower = more CPU, less VRAM. -1 = all.</Text>
					</div>
					<Badge preset="glass">{nglSlider === -1 ? "All" : nglSlider}</Badge>
				</div>
				<input
					type="range"
					class="vlp-slider"
					min="-1"
					max="99"
					bind:value={nglSlider}
					onchange={saveNgl}
				/>
			</section>
		{/if}
	</div>
{/if}

<style>
	.vlp {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		animation: slide-in 200ms ease-out;
	}
	@keyframes slide-in {
		from { opacity: 0; transform: translateX(1rem); }
		to { opacity: 1; transform: translateX(0); }
	}

	.vlp-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.vlp-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 0;
		border-bottom: 0.0625rem solid var(--border-subtle, #1a2030);
	}

	.vlp-row { display: flex; gap: 0.5rem; align-items: center; }
	.vlp-row-between { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }

	.vlp-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-inset, #080d18);
		color: var(--text-primary, #e6eaf3);
		font-size: 0.875rem;
	}
	.vlp-input:focus { outline: none; border-color: var(--accent-cyan-main, #58c4e6); }
	.vlp-input:disabled { opacity: 0.5; }
	.vlp-input-sm { max-width: 12rem; }

	.vlp-select {
		padding: 0.5rem 0.5rem;
		border-radius: var(--radius-md, 0.5rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-inset, #080d18);
		color: var(--text-primary, #e6eaf3);
		font-size: 0.75rem;
	}

	.vlp-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 999px;
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-raised, #0c1220);
		color: var(--text-secondary, #8b9bb8);
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--motion-duration-fast, 150ms);
	}
	.vlp-toggle-on {
		border-color: var(--accent-teal-main, #14b8a6);
		color: var(--accent-teal-main, #14b8a6);
		background: color-mix(in oklch, var(--accent-teal-main, #14b8a6) 12%, var(--surface-raised, #0c1220));
	}

	.vlp-voice-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.vlp-voice-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.vlp-voice-chip {
		padding: 0.375rem 0.625rem;
		border-radius: var(--radius-sm, 0.25rem);
		border: 0.0625rem solid var(--border-subtle, #1a2030);
		background: var(--surface-raised, #0c1220);
		color: var(--text-secondary, #8b9bb8);
		font-size: 0.75rem;
		cursor: pointer;
		text-align: left;
		transition: all var(--motion-duration-fast, 150ms);
	}
	.vlp-voice-chip:hover { border-color: var(--wizard-role-voice-main); color: var(--text-primary); }
	.vlp-voice-chip-active {
		border-color: var(--wizard-role-voice-main);
		color: var(--wizard-role-voice-main);
		background: color-mix(in oklch, var(--wizard-role-voice-fill) 60%, var(--surface-raised));
	}

	.vlp-clone-list, .vlp-kw-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.vlp-clone-row, .vlp-kw-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.vlp-kw-rm {
		border: none;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
	}
	.vlp-kw-rm:hover { color: var(--signal-error-main, #ef4444); }
	.vlp-kw-add {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.vlp-slider {
		width: 100%;
		accent-color: var(--accent-teal-main, #14b8a6);
	}
</style>

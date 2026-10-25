/**
 * @file Voice TTS + STT user-scope config runes.
 * @domain voice
 *
 * Two singleton rune-state instances backed by the atomic TOML
 * load/save verbs on the Rust side. The devtool Config tabs for
 * Kokoros (TTS) and Whisper (STT) mount these, mutate them, and
 * call `save()` on commit.
 */

import type { VoiceSttConfig, VoiceTtsConfig } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

class VoiceTtsConfigState {
	config = $state<VoiceTtsConfig | null>(null);
	// Editable draft — seeded from `config` on load, mutated by the UI,
	// committed on save().
	draft = $state<VoiceTtsConfig>({
		default_voice: "af_heart",
		default_speed: 1.0,
	});
	loading = $state(false);
	saving = $state(false);
	error = $state<string | null>(null);
	dirty = $derived(
		this.config === null
			? false
			: this.config.default_voice !== this.draft.default_voice ||
					Math.abs(this.config.default_speed - this.draft.default_speed) > 1e-6,
	);

	async load(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const r = await commands.voiceTtsLoadConfig();
			if (r.status === "error") throw new Error(r.error);
			this.config = r.data;
			this.draft = { ...r.data };
			logInfo("voice.tts-config", "loaded");
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("voice.tts-config", `load failed: ${this.error}`);
		} finally {
			this.loading = false;
		}
	}

	async save(): Promise<void> {
		this.saving = true;
		this.error = null;
		try {
			const r = await commands.voiceTtsSaveConfig(this.draft);
			if (r.status === "error") throw new Error(r.error);
			this.config = r.data;
			this.draft = { ...r.data };
			logInfo(
				"voice.tts-config",
				`saved voice=${r.data.default_voice} speed=${r.data.default_speed}`,
			);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("voice.tts-config", `save failed: ${this.error}`);
		} finally {
			this.saving = false;
		}
	}

	reset(): void {
		if (this.config) {
			this.draft = { ...this.config };
			this.error = null;
		}
	}
}

class VoiceSttConfigState {
	config = $state<VoiceSttConfig | null>(null);
	draft = $state<VoiceSttConfig>({
		language: "",
		beam_size: 1,
		vad_threshold: 0.5,
	});
	loading = $state(false);
	saving = $state(false);
	error = $state<string | null>(null);
	dirty = $derived(
		this.config === null
			? false
			: this.config.language !== this.draft.language ||
					this.config.beam_size !== this.draft.beam_size ||
					Math.abs(this.config.vad_threshold - this.draft.vad_threshold) > 1e-6,
	);

	async load(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const r = await commands.voiceSttLoadConfig();
			if (r.status === "error") throw new Error(r.error);
			this.config = r.data;
			this.draft = { ...r.data };
			logInfo("voice.stt-config", "loaded");
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("voice.stt-config", `load failed: ${this.error}`);
		} finally {
			this.loading = false;
		}
	}

	async save(): Promise<void> {
		this.saving = true;
		this.error = null;
		try {
			const r = await commands.voiceSttSaveConfig(this.draft);
			if (r.status === "error") throw new Error(r.error);
			this.config = r.data;
			this.draft = { ...r.data };
			logInfo(
				"voice.stt-config",
				`saved language=${r.data.language || "auto"} beam=${r.data.beam_size} vad=${r.data.vad_threshold}`,
			);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("voice.stt-config", `save failed: ${this.error}`);
		} finally {
			this.saving = false;
		}
	}

	reset(): void {
		if (this.config) {
			this.draft = { ...this.config };
			this.error = null;
		}
	}
}

export const voiceTtsConfigState = new VoiceTtsConfigState();
export const voiceSttConfigState = new VoiceSttConfigState();

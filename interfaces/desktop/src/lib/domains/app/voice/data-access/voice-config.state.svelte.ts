/**
 * @file Voice TTS + STT user-scope config runes.
 * @domain voice
 *
 * Two singleton rune-state instances backed by the atomic TOML
 * load/save verbs on the Rust side. The Voice Lab's TTS and STT tabs
 * mount these, mutate them, and call `save()` on commit.
 */

import type { VoiceSttConfig, VoiceTtsConfig } from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";
import * as service from "./voice.service.js";

class VoiceTtsConfigState {
	config = $state<VoiceTtsConfig | null>(null);
	// Editable draft — seeded from `config` on load, mutated by the UI,
	// committed on save(). The backend's file holds the real defaults.
	draft = $state<VoiceTtsConfig>({
		default_voice: "",
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
			const data = await service.loadTtsConfig();
			this.config = data;
			this.draft = { ...data };
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
			const data = await service.saveTtsConfig(this.draft);
			this.config = data;
			this.draft = { ...data };
			logInfo("voice.tts-config", `saved voice=${data.default_voice} speed=${data.default_speed}`);
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
			const data = await service.loadSttConfig();
			this.config = data;
			this.draft = { ...data };
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
			const data = await service.saveSttConfig(this.draft);
			this.config = data;
			this.draft = { ...data };
			logInfo(
				"voice.stt-config",
				`saved language=${data.language || "auto"} beam=${data.beam_size} vad=${data.vad_threshold}`,
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

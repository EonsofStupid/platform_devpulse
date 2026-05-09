/**
 * @file tts-config.state.svelte.ts — atomic TTS config rune.
 * @module @devpulse/devtools/clyffy/mouth/tts
 *
 * Singleton mirroring `{data_dir}/user/voice_tts.toml`.
 */

import type { VoiceTtsConfig } from "$lib/devtools/_shared/voice-contracts.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

class TtsConfigState {
	config = $state<VoiceTtsConfig | null>(null);
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
			logInfo("devtools.tts-config", "loaded");
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.tts-config", `load failed: ${this.error}`);
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
				"devtools.tts-config",
				`saved voice=${r.data.default_voice} speed=${r.data.default_speed}`,
			);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.tts-config", `save failed: ${this.error}`);
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

export const ttsConfigState = new TtsConfigState();

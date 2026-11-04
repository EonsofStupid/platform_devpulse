/**
 * @file stt-config.state.svelte.ts — atomic STT config rune.
 * @module @devpulse/devtools/clyffy/ears/stt
 *
 * Singleton mirroring `{data_dir}/user/voice_stt.toml`. Load on mount,
 * mutate `draft`, call `save()` to commit. `dirty` derives from
 * `config` vs `draft`. Pattern matches `project_user_config_pattern`.
 */

import type { VoiceSttConfig } from "#lib/devtools/_shared/voice-contracts.js";
import { commands } from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";

class SttConfigState {
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
			logInfo("devtools.stt-config", "loaded");
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.stt-config", `load failed: ${this.error}`);
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
				"devtools.stt-config",
				`saved language=${r.data.language || "auto"} beam=${r.data.beam_size} vad=${r.data.vad_threshold}`,
			);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.stt-config", `save failed: ${this.error}`);
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

export const sttConfigState = new SttConfigState();

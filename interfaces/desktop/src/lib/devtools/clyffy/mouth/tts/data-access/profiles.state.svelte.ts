/**
 * @file profiles.state.svelte.ts — TTS profile CRUD rune.
 * @module @devpulse/devtools/clyffy/mouth/tts
 *
 * Profiles persist `tts_voice_id` + `stt_quality` per user-named slot.
 * The TTS devtool owns the surface (Profiles extra-tab) because the
 * dominant payload is voice id; STT quality rides along.
 *
 * Backing IPCs:
 *   - `list_voice_profiles`     → load
 *   - `save_voice_profile`      → upsert
 *   - `delete_voice_profile`    → remove
 *   - `activate_voice_profile`  → mark exclusive `active`
 */

import type { VoiceProfile } from "$lib/devtools/_shared/voice-contracts.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

class ProfilesState {
	profiles = $state<VoiceProfile[]>([]);
	loading = $state(false);
	mutating = $state(false);
	error = $state<string | null>(null);

	/** Profile currently being edited (null = view mode, no draft open). */
	draft = $state<VoiceProfile | null>(null);

	active = $derived(this.profiles.find((p) => p.active) ?? null);

	async load(): Promise<void> {
		this.loading = true;
		this.error = null;
		try {
			const r = await commands.listVoiceProfiles();
			if (r.status === "error") throw new Error(r.error);
			this.profiles = r.data;
			logInfo("devtools.tts-profiles", `loaded ${r.data.length} profile(s)`);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.tts-profiles", `load failed: ${this.error}`);
		} finally {
			this.loading = false;
		}
	}

	startNew(seedVoice = "af_heart", seedQuality = "standard"): void {
		this.draft = {
			id: crypto.randomUUID(),
			name: "",
			tts_voice_id: seedVoice,
			stt_quality: seedQuality,
			active: false,
		};
	}

	startEdit(id: string): void {
		const p = this.profiles.find((x) => x.id === id);
		if (p) this.draft = { ...p };
	}

	cancelDraft(): void {
		this.draft = null;
	}

	async commitDraft(): Promise<void> {
		if (!this.draft) return;
		const profile = { ...this.draft };
		this.mutating = true;
		this.error = null;
		try {
			const r = await commands.saveVoiceProfile(profile);
			if (r.status === "error") throw new Error(r.error);
			logInfo("devtools.tts-profiles", `saved profile id=${profile.id} name=${profile.name}`);
			this.draft = null;
			await this.load();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.tts-profiles", `save failed: ${this.error}`);
		} finally {
			this.mutating = false;
		}
	}

	async activate(id: string): Promise<void> {
		this.mutating = true;
		this.error = null;
		try {
			const r = await commands.activateVoiceProfile(id);
			if (r.status === "error") throw new Error(r.error);
			logInfo("devtools.tts-profiles", `activated profile id=${id}`);
			await this.load();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.tts-profiles", `activate failed: ${this.error}`);
		} finally {
			this.mutating = false;
		}
	}

	async remove(id: string): Promise<void> {
		this.mutating = true;
		this.error = null;
		try {
			const r = await commands.deleteVoiceProfile(id);
			if (r.status === "error") throw new Error(r.error);
			logInfo("devtools.tts-profiles", `deleted profile id=${id}`);
			await this.load();
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
			logError("devtools.tts-profiles", `delete failed: ${this.error}`);
		} finally {
			this.mutating = false;
		}
	}
}

export const profilesState = new ProfilesState();

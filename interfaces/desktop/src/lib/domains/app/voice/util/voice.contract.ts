/**
 * @file Voice domain contracts — types for TTS/STT configuration.
 * @domain voice
 *
 * The wire types are the backend's own, generated from the Rust structs under
 * `interfaces/desktop/src-tauri/src/commands/voice/mod.rs`. Fields use
 * snake_case because Tauri IPC serializes Rust structs as snake_case —
 * do not rename in TypeScript, field access must match the wire format.
 *
 * Every voice comes from the voice registry TOML at
 * `systems/devpulse-engine/config/voices.default.toml`, and which engine owns
 * it is that registry's data. Nothing is hardcoded in Rust or TS — the backend
 * reads the registry at runtime.
 */

import type { SlotInfo, VoiceLabCopy } from "#lib/sys/generated/bindings.js";

export type {
	MicTestResult,
	SlotInfo,
	StsPipelineResult,
	VoiceInfo,
	VoiceLabCopy,
	VoiceProfile,
	VoiceSmokeReport,
	VoiceStatusInfo,
} from "#lib/sys/generated/bindings.js";

/** Voice Lab tab identifiers. */
export type VoiceLabTab = "tts" | "stt" | "profiles" | "test";

/** Speech-to-text slot, by the identity `slots.default.toml` gives it. */
export const STT_SLOT = "voice.stt";
/** Text-to-speech slot. */
export const TTS_SLOT = "voice.tts";
/** Full-duplex voice conversation slot. */
export const VOICE_BRAIN_SLOT = "voice.brain";
/** The brain the file-based speech-to-speech run answers through. */
export const STS_BRAIN_SLOT = "chat.brain";

/** The profile the backend always lists; it cannot be deleted. */
export const DEFAULT_PROFILE_ID = "default";

/** The language list's name for "no hint"; saved as an empty string. */
export const AUTO_LANGUAGE = "auto";

/** What a slot is configured with, in the catalog's words. */
export function describeSlotConfig(slot: SlotInfo | null, copy: VoiceLabCopy): string {
	if (!slot) return copy.slot_not_found;
	if (slot.assigned_model_id) return copy.slot_assigned;
	if (slot.default_model) return copy.slot_bundled;
	return copy.slot_unassigned;
}

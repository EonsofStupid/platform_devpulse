/**
 * @file Voice domain contracts — types for TTS/STT configuration.
 * @domain voice
 *
 * These types mirror the Rust structs under
 * `interfaces/desktop/src-tauri/src/commands/voice/mod.rs`. Fields use
 * snake_case because Tauri IPC serializes Rust structs as snake_case —
 * do not rename in TypeScript, field access must match the wire format.
 */

/**
 * A voice available for TTS synthesis.
 *
 * Every field is driven by the voice registry TOML at
 * `systems/devpulse-engine/config/voices.default.toml`. Nothing is hardcoded
 * in Rust or TS — the backend reads the registry at runtime.
 */
export interface VoiceInfo {
	/** Voice identifier (e.g. `af_heart`, `am_adam`). */
	id: string;
	/** Human-friendly display label. */
	label: string;
	/** Gender bucket for UI filtering. */
	gender: "female" | "male" | "neutral";
	/** BCP-47 language tag (`en-US`, `en-GB`, …). */
	language: string;
	/** Which TTS backend owns this voice. */
	engine: "kokoro" | "piper";
	/** Freeform style descriptor (`warm`, `casual`, `professional`). */
	style: string;
	/** Preview line used by the Preview button. */
	sample_text: string;
	/** One-line blurb shown under the label in the picker. */
	description: string;
}

/** A saved voice configuration profile. */
export interface VoiceProfile {
	/** Unique profile ID. */
	id: string;
	/** User-facing name (e.g. "Clyffy Male Default"). */
	name: string;
	/** TTS voice identifier from the registry. */
	tts_voice_id: string;
	/** STT model preference: `standard` | `high_quality` | `best`. */
	stt_quality: string;
	/** Whether this profile is currently active. */
	active: boolean;
}

/** Microphone test result. */
export interface MicTestResult {
	/** Whether a mic was detected at all. */
	detected: boolean;
	/** Peak amplitude observed (0.0 – 1.0). */
	peak_amplitude: number;
	/** Average amplitude. */
	avg_amplitude: number;
	/** Noise floor estimate (bottom 10% of samples). */
	noise_floor: number;
}

/**
 * Result of a full speech-to-speech pipeline run:
 * audio → STT → brain → TTS → playback.
 */
export interface StsPipelineResult {
	/** Transcript produced by the STT stage. */
	transcript: string;
	/** Reply text produced by the brain stage. */
	reply: string;
	/** Voice used for the TTS stage. */
	voice: string;
}

/** Voice Lab tab identifiers. */
export type VoiceLabTab = "tts" | "stt" | "profiles" | "test";

/**
 * Fallback profile used before `list_voice_profiles` returns. Matches the
 * shape backend sends when profile persistence isn't wired yet. Once the
 * GlobalDb persistence sprint lands, this can be deleted.
 */
export const FALLBACK_PROFILE: VoiceProfile = {
	id: "default",
	name: "Default",
	tts_voice_id: "af_heart",
	stt_quality: "standard",
	active: true,
};

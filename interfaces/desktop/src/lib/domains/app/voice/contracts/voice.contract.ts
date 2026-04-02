/**
 * @file Voice domain contracts — types for TTS/STT configuration.
 * @domain voice
 *
 * These types mirror Rust VoiceInfo/VoiceProfile structs (specta-generated).
 * Until specta regenerates, define them manually.
 */

/** A voice available for TTS synthesis. */
export interface VoiceInfo {
	/** Voice identifier (e.g. "tara", "leo"). */
	id: string;
	/** Display label (e.g. "Tara (Female, Warm)"). */
	label: string;
	/** Gender: "female" | "male". */
	gender: "female" | "male";
	/** Sample text for preview. */
	sampleText: string;
}

/** A saved voice configuration profile. */
export interface VoiceProfile {
	/** Unique profile ID. */
	id: string;
	/** User-facing name (e.g. "Clyffy Male Default"). */
	name: string;
	/** TTS slot ID (e.g. "voice.tts.primary"). */
	ttsSlot: string;
	/** Selected voice name (e.g. "leo"). */
	ttsVoice: string;
	/** Speech speed multiplier (0.5 - 2.0, default 1.0). */
	ttsSpeed: number;
	/** STT slot ID (e.g. "voice.stt"). */
	sttSlot: string;
	/** STT language code (e.g. "en"). */
	sttLanguage: string;
	/** VAD sensitivity (0.0 - 1.0, lower = more sensitive). */
	vadSensitivity: number;
	/** Whether this is the active default profile. */
	isDefault: boolean;
}

/** Microphone test result. */
export interface MicTestResult {
	/** Peak audio level (0.0 - 1.0). */
	peakLevel: number;
	/** Average audio level. */
	avgLevel: number;
	/** Test duration in milliseconds. */
	durationMs: number;
	/** Audio input device name. */
	deviceName: string;
}

/** Voice Lab tab identifiers. */
export type VoiceLabTab = "tts" | "stt" | "profiles" | "test";

/** Default voices — ship with the app. */
export const DEFAULT_PROFILES: VoiceProfile[] = [
	{
		id: "default-male",
		name: "Clyffy Male Default",
		ttsSlot: "voice.tts.primary",
		ttsVoice: "leo",
		ttsSpeed: 1.0,
		sttSlot: "voice.stt",
		sttLanguage: "en",
		vadSensitivity: 0.4,
		isDefault: true,
	},
	{
		id: "default-female",
		name: "Clyffy Female Warm",
		ttsSlot: "voice.tts.primary",
		ttsVoice: "tara",
		ttsSpeed: 0.95,
		sttSlot: "voice.stt",
		sttLanguage: "en",
		vadSensitivity: 0.4,
		isDefault: false,
	},
];

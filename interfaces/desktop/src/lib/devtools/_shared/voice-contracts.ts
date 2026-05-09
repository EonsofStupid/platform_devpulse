/**
 * @file voice-contracts.ts — shared voice types for cross-devtool consumers.
 * @module @devpulse/devtools/_shared
 *
 * Types live on the Rust side (specta::Type, surfaced through bindings).
 * This file re-exports them with friendlier names so the three voice
 * devtools (stt / sts / mouth/tts) can import from a single neighbour
 * without each pulling `$lib/sys/generated/bindings.js` directly.
 *
 * IP boundary rule (memory `feedback_ip_boundary_is_vocabulary_not_wrappers`):
 * no parallel TS interfaces, no `From` adapters — just re-exports.
 */

export type {
	MicTestResult,
	StsPipelineResult,
	VoiceInfo,
	VoiceProfile,
	VoiceSmokeReport,
	VoiceSttConfig,
	VoiceTtsConfig,
} from "$lib/sys/generated/bindings.js";

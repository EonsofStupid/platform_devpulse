/**
 * @file sys/bindings/voice/index.ts
 * @description Voice surface — TTS / STT / STS pipeline + profiles + smoke.
 */

import { commands } from "#lib/sys/generated/bindings.js";

// ── Status + speak + listen ─────────────────────────────────────
export const getVoiceStatus = commands.getVoiceStatus;
export const speak = commands.speak;
export const stopSpeaking = commands.stopSpeaking;
export const isSpeaking = commands.isSpeaking;
export const listVoices = commands.listVoices;
export const previewVoice = commands.previewVoice;

// ── STT ─────────────────────────────────────────────────────────
export const testMicrophone = commands.testMicrophone;
export const transcribeAudio = commands.transcribeAudio;
export const transcribeAudioFile = commands.transcribeAudioFile;

// ── STS pipeline + smoke ────────────────────────────────────────
export const runStsPipeline = commands.runStsPipeline;
export const voiceSmokeTest = commands.voiceSmokeTest;

// ── Profiles ────────────────────────────────────────────────────
export const listVoiceProfiles = commands.listVoiceProfiles;
export const saveVoiceProfile = commands.saveVoiceProfile;
export const deleteVoiceProfile = commands.deleteVoiceProfile;
export const activateVoiceProfile = commands.activateVoiceProfile;

// ── Config (TTS / STT) ──────────────────────────────────────────
export const voiceTtsLoadConfig = commands.voiceTtsLoadConfig;
export const voiceTtsSaveConfig = commands.voiceTtsSaveConfig;
export const voiceSttLoadConfig = commands.voiceSttLoadConfig;
export const voiceSttSaveConfig = commands.voiceSttSaveConfig;

// ── Speech endpoints ────────────────────────────────────────────
export const voiceEndpointsList = commands.voiceEndpointsList;
export const voiceEndpointGet = commands.voiceEndpointGet;
export const voiceEndpointSet = commands.voiceEndpointSet;
export const voiceEndpointClear = commands.voiceEndpointClear;

// ── Types ───────────────────────────────────────────────────────
export type {
	MicTestResult,
	StsPipelineResult,
	TtsConfig,
	VoiceInfo,
	VoiceProfile,
	VoiceSmokeReport,
	VoiceStatusInfo,
	VoiceSttConfig,
	VoiceTtsConfig,
} from "#lib/sys/generated/bindings.js";

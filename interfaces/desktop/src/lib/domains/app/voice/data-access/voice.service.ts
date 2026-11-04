/**
 * @file Voice service — Tauri IPC wrappers for voice commands.
 * @domain voice
 *
 * The only place the voice domain talks to Rust. A failure becomes a thrown
 * `Error` carrying Rust's message, for the caller to show.
 */

import { formatLoadError } from "$lib/domains/app/models/index.js";
import {
	commands,
	type MicTestResult,
	type Result,
	type SlotInfo,
	type StsPipelineResult,
	type VoiceInfo,
	type VoiceProfile,
	type VoiceSmokeReport,
	type VoiceStatusInfo,
	type VoiceSttConfig,
	type VoiceTtsConfig,
} from "$lib/sys/generated/bindings.js";

function take<T>(result: Result<T, string>): T {
	if (result.status === "error") throw new Error(result.error);
	return result.data;
}

/** Speak text through the active TTS slot. */
export async function speak(
	text: string,
	voice?: string,
	slot?: string,
	speed?: number,
): Promise<void> {
	take(await commands.speak(text, voice ?? null, slot ?? null, speed ?? null));
}

/** Stop current speech playback. */
export async function stopSpeaking(): Promise<void> {
	take(await commands.stopSpeaking());
}

/** Check if audio is currently playing. */
export async function isSpeaking(): Promise<boolean> {
	return take(await commands.isSpeaking());
}

/** List available voices for a TTS slot. */
export async function listVoices(slotId: string): Promise<VoiceInfo[]> {
	return take(await commands.listVoices(slotId));
}

/** Preview a specific voice with its registry sample line. */
export async function previewVoice(voice: string, slotId: string): Promise<void> {
	take(await commands.previewVoice(voice, slotId));
}

/** Test microphone — captures a short sample, returns level stats. */
export async function testMicrophone(): Promise<MicTestResult> {
	return take(await commands.testMicrophone());
}

/** Record and transcribe speech. */
export async function transcribeAudio(): Promise<string> {
	return take(await commands.transcribeAudio());
}

/**
 * Transcribe an audio file on disk.
 *
 * Supported formats: MP3, WAV, FLAC, Vorbis. Decoded to mono 16 kHz PCM
 * via rodio, then passed to the STT slot. Path must be absolute.
 */
export async function transcribeAudioFile(path: string): Promise<string> {
	return take(await commands.transcribeAudioFile(path));
}

/**
 * Run the full speech-to-speech pipeline on an audio file.
 *
 * Stages: decode → STT → brain inference → TTS → playback.
 * Returns the transcript, the model reply, and the voice used.
 */
export async function runStsPipeline(
	audioPath: string,
	brainSlot: string | null,
	voice: string | null,
	maxTokens: number | null,
): Promise<StsPipelineResult> {
	return take(await commands.runStsPipeline(audioPath, brainSlot, voice, maxTokens));
}

/** List saved voice profiles. */
export async function listProfiles(): Promise<VoiceProfile[]> {
	return take(await commands.listVoiceProfiles());
}

/** Save a voice profile. */
export async function saveProfile(profile: VoiceProfile): Promise<void> {
	take(await commands.saveVoiceProfile(profile));
}

/** Delete a voice profile. */
export async function deleteProfile(profileId: string): Promise<void> {
	take(await commands.deleteVoiceProfile(profileId));
}

/** Activate a voice profile as the default. */
export async function activateProfile(profileId: string): Promise<void> {
	take(await commands.activateVoiceProfile(profileId));
}

/** Which voice slots have a model loaded. */
export async function getVoiceStatus(): Promise<VoiceStatusInfo> {
	return take(await commands.getVoiceStatus());
}

/** Every slot in the registry. */
export async function listSlots(): Promise<SlotInfo[]> {
	return take(await commands.getSlots());
}

/** Load a slot's assigned model; a slot already loaded stays loaded. */
export async function ensureSlotLoaded(slotId: string): Promise<void> {
	const result = await commands.loadSlot(slotId);
	if (result.status === "error") throw new Error(formatLoadError(result.error));
}

/** Closed-loop round trip: the TTS slot's audio into the STT slot. */
export async function runSmokeTest(): Promise<VoiceSmokeReport> {
	return take(await commands.voiceSmokeTest());
}

/** The default voice as the assistant config holds it (`<engine>:<voice>`). */
export async function getDefaultVoiceProfile(): Promise<string> {
	return take(await commands.getAssistantConfig()).tts.profile;
}

/** Save the default voice (`<engine>:<voice>`). */
export async function setDefaultVoiceProfile(profile: string): Promise<void> {
	take(await commands.setVoiceProfile(profile));
}

/** Ask for an audio file through the native picker; null when dismissed. */
export async function pickAudioFile(title: string): Promise<string | null> {
	return take(await commands.pickAudioFile(title));
}

/** Read the saved TTS settings. */
export async function loadTtsConfig(): Promise<VoiceTtsConfig> {
	return take(await commands.voiceTtsLoadConfig());
}

/** Save TTS settings; returns them as written, clamped. */
export async function saveTtsConfig(config: VoiceTtsConfig): Promise<VoiceTtsConfig> {
	return take(await commands.voiceTtsSaveConfig(config));
}

/** Read the saved STT settings. */
export async function loadSttConfig(): Promise<VoiceSttConfig> {
	return take(await commands.voiceSttLoadConfig());
}

/** Save STT settings; returns them as written, clamped. */
export async function saveSttConfig(config: VoiceSttConfig): Promise<VoiceSttConfig> {
	return take(await commands.voiceSttSaveConfig(config));
}

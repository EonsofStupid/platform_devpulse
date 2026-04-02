/**
 * @file Voice service — Tauri IPC wrappers for voice commands.
 * @domain voice
 */

import { invoke } from "@tauri-apps/api/core";
import type { MicTestResult, VoiceInfo, VoiceProfile } from "../contracts/voice.contract.js";

/** Speak text through the active TTS slot. */
export async function speak(text: string, voice?: string, slot?: string): Promise<void> {
	await invoke("speak", { text, voice: voice ?? null, slot: slot ?? null });
}

/** Stop current speech playback. */
export async function stopSpeaking(): Promise<void> {
	await invoke("stop_speaking");
}

/** Check if audio is currently playing. */
export async function isSpeaking(): Promise<boolean> {
	return invoke("is_speaking");
}

/** List available voices for a TTS slot. */
export async function listVoices(slotId: string): Promise<VoiceInfo[]> {
	return invoke("list_voices", { slotId });
}

/** Preview a specific voice with a sample sentence. */
export async function previewVoice(voice: string, slotId: string): Promise<void> {
	await invoke("preview_voice", { voice, slotId });
}

/** Test microphone — records 3 seconds, returns level stats. */
export async function testMicrophone(): Promise<MicTestResult> {
	return invoke("test_microphone");
}

/** Record and transcribe speech. */
export async function transcribeAudio(): Promise<string> {
	return invoke("transcribe_audio");
}

/** List saved voice profiles. */
export async function listProfiles(): Promise<VoiceProfile[]> {
	return invoke("list_voice_profiles");
}

/** Save a voice profile. */
export async function saveProfile(profile: VoiceProfile): Promise<void> {
	await invoke("save_voice_profile", { profile });
}

/** Delete a voice profile. */
export async function deleteProfile(profileId: string): Promise<void> {
	await invoke("delete_voice_profile", { profileId });
}

/** Activate a voice profile as the default. */
export async function activateProfile(profileId: string): Promise<void> {
	await invoke("activate_voice_profile", { profileId });
}

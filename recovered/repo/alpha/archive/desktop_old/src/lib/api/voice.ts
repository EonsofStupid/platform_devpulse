/**
 * Voice API - Tauri command wrappers for voice functionality
 */
import { invoke } from '@tauri-apps/api/core';

export interface VoiceStatus {
	stt_ready: boolean;
	tts_ready: boolean;
	stt_missing: string[];
	tts_missing: string[];
}

/**
 * Get voice model status (initial status)
 */
export async function getVoiceStatus(): Promise<VoiceStatus> {
	return invoke<VoiceStatus>('get_voice_status');
}

/**
 * Check voice model status (for live monitoring)
 */
export async function checkVoiceStatus(): Promise<VoiceStatus> {
	return invoke<VoiceStatus>('check_voice_status');
}

/**
 * Get voice model download instructions
 */
export async function getVoiceDownloadInstructions(): Promise<string> {
	return invoke<string>('get_voice_download_instructions');
}

/**
 * Speak text using TTS (returns WAV bytes)
 */
export async function speak(text: string): Promise<Uint8Array> {
	return invoke<number[]>('speak', { text }).then((arr) => new Uint8Array(arr));
}

/**
 * Transcribe audio using STT (accepts WAV bytes)
 */
export async function transcribe(audioBytes: Uint8Array): Promise<string> {
	return invoke<string>('transcribe', { audioBytes: Array.from(audioBytes) });
}

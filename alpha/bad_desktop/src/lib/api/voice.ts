/**
 * Voice API - Tauri command wrappers for voice functionality
 *
 * Includes:
 * - Voice status (STT/TTS readiness)
 * - TTS (speak) and STT (transcribe)
 * - Voice model discovery and setup
 */
import { invoke } from '@tauri-apps/api/core';

// ============== Types ==============

export interface VoiceStatus {
	stt_ready: boolean;
	tts_ready: boolean;
	stt_missing: string[];
	tts_missing: string[];
}

export interface WhisperModel {
	id: string;
	name: string;
	path: string;
	size: string;
	ready: boolean;
	missing: string[];
}

export interface KokoroModel {
	id: string;
	name: string;
	path: string;
	ready: boolean;
	missing: string[];
	voices: string[];
}

export interface VoiceDiscoveryResult {
	scanned_path: string;
	whisper_models: WhisperModel[];
	kokoro_models: KokoroModel[];
	errors: string[];
	has_stt: boolean;
	has_tts: boolean;
}

// ============== Basic Voice APIs ==============

/**
 * Get voice model status
 */
export async function getVoiceStatus(): Promise<VoiceStatus> {
	return invoke<VoiceStatus>('get_voice_status');
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

// ============== Voice Discovery APIs ==============

/**
 * Scan a folder for Whisper/Kokoro voice models
 *
 * User browses to a folder containing voice models.
 * Returns discovered models with their readiness status.
 */
export async function scanVoiceModels(path: string): Promise<VoiceDiscoveryResult> {
	return invoke<VoiceDiscoveryResult>('scan_voice_models', { path });
}

/**
 * Get current voice discovery result (if any)
 *
 * Returns null if no folder has been scanned yet.
 */
export async function getVoiceDiscovery(): Promise<VoiceDiscoveryResult | null> {
	return invoke<VoiceDiscoveryResult | null>('get_voice_discovery');
}

/**
 * Get voice model download/setup instructions
 *
 * Returns helpful text explaining how to download and set up voice models.
 */
export async function getVoiceSetupHelp(): Promise<string> {
	return invoke<string>('get_voice_setup_help');
}

/**
 * Select a discovered Whisper (STT) model
 */
export async function selectWhisperModel(id: string): Promise<void> {
	return invoke<void>('select_whisper_model', { id });
}

/**
 * Select a discovered Kokoro (TTS) model
 */
export async function selectKokoroModel(id: string): Promise<void> {
	return invoke<void>('select_kokoro_model', { id });
}

/**
 * Save voice model path to user config
 *
 * After user selects a folder with voice models, save it so it persists
 * across restarts. Returns current voice status.
 */
export async function saveVoiceModelPath(path: string): Promise<VoiceStatus> {
	return invoke<VoiceStatus>('save_voice_model_path', { path });
}

// ============== Helper Functions ==============

/**
 * Check if voice is fully configured (at least one of STT/TTS ready)
 */
export function isVoiceConfigured(status: VoiceStatus): boolean {
	return status.stt_ready || status.tts_ready;
}

/**
 * Check if voice setup is needed
 */
export function needsVoiceSetup(status: VoiceStatus): boolean {
	return !status.stt_ready && !status.tts_ready;
}

/**
 * Get a user-friendly summary of voice status
 */
export function getVoiceStatusSummary(status: VoiceStatus): string {
	if (status.stt_ready && status.tts_ready) {
		return 'Voice fully configured';
	} else if (status.stt_ready) {
		return 'Speech-to-text ready (TTS not configured)';
	} else if (status.tts_ready) {
		return 'Text-to-speech ready (STT not configured)';
	} else {
		return 'Voice not configured';
	}
}

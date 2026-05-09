/**
 * @file tts.svc.ts — TTS-facing Tauri IPC wrappers.
 * @module @devpulse/devtools/clyffy/mouth/tts
 */

import { invoke } from "@tauri-apps/api/core";
import type { VoiceInfo } from "$lib/devtools/_shared/voice-contracts.js";

/** Speak text through the active TTS slot. */
export async function speak(
	text: string,
	voice?: string,
	slot?: string,
	speed?: number,
): Promise<void> {
	await invoke("speak", {
		text,
		voice: voice ?? null,
		slot: slot ?? null,
		speed: speed ?? null,
	});
}

/** Stop current speech playback. */
export async function stopSpeaking(): Promise<void> {
	await invoke("stop_speaking");
}

/** Whether the active TTS slot is currently producing audio. */
export async function isSpeaking(): Promise<boolean> {
	return invoke("is_speaking");
}

/** List all voices the configured TTS slot exposes through the registry. */
export async function listVoices(slotId: string): Promise<VoiceInfo[]> {
	return invoke("list_voices", { slotId });
}

/** Preview a single voice with a fixed sample sentence. */
export async function previewVoice(voice: string, slotId: string): Promise<void> {
	await invoke("preview_voice", { voice, slotId });
}

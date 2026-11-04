/**
 * @file stt.svc.ts — STT-facing Tauri IPC wrappers.
 * @module @devpulse/devtools/clyffy/ears/stt
 *
 * Thin throw-on-error wrappers over the generated bindings, kept for
 * call-site ergonomics. Devtools that need richer error handling can
 * call `commands.testMicrophone()` etc. directly from
 * `#lib/sys/generated/bindings.js` to get the `Result<T, string>` shape.
 */

import { invoke } from "@tauri-apps/api/core";
import type { MicTestResult } from "#lib/devtools/_shared/voice-contracts.js";

/** Test microphone — records ~1 s, returns peak/avg/noise-floor stats. */
export async function testMicrophone(): Promise<MicTestResult> {
	return invoke("test_microphone");
}

/** Record from the default mic for a fixed window and return the transcript. */
export async function transcribeAudio(): Promise<string> {
	return invoke("transcribe_audio");
}

/**
 * Transcribe an audio file on disk (MP3/WAV/FLAC/Vorbis decoded to mono
 * 16 kHz PCM, then passed to the loaded STT slot). Path must be absolute.
 */
export async function transcribeAudioFile(path: string): Promise<string> {
	return invoke("transcribe_audio_file", { path });
}

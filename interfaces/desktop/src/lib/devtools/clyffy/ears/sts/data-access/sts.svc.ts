/**
 * @file sts.svc.ts — STS pipeline IPC wrapper.
 * @module @devpulse/devtools/clyffy/ears/sts
 *
 * The per-stage latency rune is `sts-latency.state.svelte.ts`: runes
 * compile only in `.svelte` / `.svelte.ts` modules.
 */

import { invoke } from "@tauri-apps/api/core";
import type { StsPipelineResult } from "$lib/devtools/_shared/voice-contracts.js";

/**
 * Run audio file → STT → brain → TTS → playback. Returns transcript,
 * model reply text, and the voice id used for synthesis.
 */
export async function runStsPipeline(
	audioPath: string,
	brainSlot: string | null,
	voice: string | null,
	maxTokens: number | null,
): Promise<StsPipelineResult> {
	return invoke("run_sts_pipeline", {
		audioPath,
		brainSlot,
		voice,
		maxTokens,
	});
}

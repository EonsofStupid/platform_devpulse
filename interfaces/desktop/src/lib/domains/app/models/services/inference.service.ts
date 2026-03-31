/**
 * @file Inference Service
 * @module @devpulse/domains/app/models/services/inference
 *
 * Text generation via loaded models. Streams tokens back.
 */

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { logError, logInfo } from "$lib/sys/logger.js";

/** Generate text from a loaded model slot. */
export async function generateText(
	slotId: string,
	prompt: string,
	maxTokens = 256,
	temperature = 0.7,
): Promise<string> {
	try {
		logInfo("inference", `Generating from ${slotId}: "${prompt.slice(0, 50)}..."`);
		const result = await invoke<string>("inference_generate", {
			slotId,
			prompt,
			maxTokens,
			temperature,
		});
		logInfo("inference", `Generation complete: ${result.length} chars`);
		return result;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("inference", `Generation failed: ${msg}`);
		throw new Error(msg);
	}
}

/** Subscribe to streaming token events during generation. */
export function onInferenceToken(
	callback: (token: { id: number; text: string }) => void,
): () => void {
	let unlisten: (() => void) | null = null;

	listen<{ id: number; text: string }>("inference-token", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});

	return () => {
		unlisten?.();
	};
}

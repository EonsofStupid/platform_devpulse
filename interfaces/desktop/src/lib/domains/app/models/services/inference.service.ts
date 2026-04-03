/**
 * @file Inference Service
 * @module @devpulse/domains/app/models/services/inference
 *
 * Text generation via loaded models. Streams tokens back.
 * Uses specta-generated bindings for type-safe IPC.
 */

import { listen } from "@tauri-apps/api/event";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";

/** Unwrap a specta Result or throw. */
function unwrap<T>(result: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (result.status === "ok") return result.data;
	throw new Error(result.error);
}

/** Generate text from a loaded model slot. */
export async function generateText(
	slotId: string,
	prompt: string,
	maxTokens = 256,
	temperature = 0.7,
): Promise<string> {
	try {
		logInfo("inference", `Generating from ${slotId}: "${prompt.slice(0, 50)}..."`);
		const result = unwrap(await commands.inferenceGenerate(slotId, prompt, maxTokens, temperature));
		logInfo("inference", `Generation complete: ${result.length} chars`);
		return result;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("inference", `Generation failed: ${msg}`);
		throw new Error(msg);
	}
}

/** Subscribe to streaming token events during generation. Rust emits bare string payloads. */
export function onInferenceToken(callback: (text: string) => void): () => void {
	let unlisten: (() => void) | null = null;

	listen<string>("inference-token", (event) => {
		callback(event.payload);
	}).then((fn) => {
		unlisten = fn;
	});

	return () => {
		unlisten?.();
	};
}

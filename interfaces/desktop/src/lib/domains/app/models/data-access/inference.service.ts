/**
 * @file Inference service — text generation + streaming token bridge.
 * @module @devpulse/domains/app/models/data-access/inference
 *
 * Thin wrapper over `commands.inferenceGenerate` (Tauri/specta) and the
 * `inference-token` event the kernel re-emits during generation. Wraps
 * the call in `withAction("models.inference", ...)` so the activity HUD
 * surfaces the run and the structured action log captures it.
 *
 * The Rust side covers both routes:
 *   - GGUF sidecar (llama-server) — token events forwarded as `inference-token`
 *   - Candle in-process (SafeTensors) — direct `inference-token` emit
 *
 * Consumers (chat composer, voice lab, wizard test chat) only need:
 *   1. `generateText(slot, prompt)` for the full-text result
 *   2. `onInferenceToken(cb)` for live streaming bubbles
 */

import { listen } from "@tauri-apps/api/event";
import { withAction } from "#lib/sys/action-bus.svelte.js";
import { commands } from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";

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
	return withAction("models.inference", "Running inference on your loaded model…", async () => {
		try {
			logInfo("inference", `Generating from ${slotId}: "${prompt.slice(0, 50)}..."`);
			const result = unwrap(
				await commands.inferenceGenerate(slotId, prompt, maxTokens, temperature),
			);
			logInfo("inference", `Generation complete: ${result.length} chars`);
			return result;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			logError("inference", `Generation failed: ${msg}`);
			throw new Error(msg);
		}
	});
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

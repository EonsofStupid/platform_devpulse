/**
 * @file Import Router
 * @module @devpulse/domains/app/models/features/setup-wizard/import-router
 *
 * Maps slot IDs to filesystem subdirectories for model file placement.
 * Used by wizard UI and Rust import command (Sprint 5).
 *
 * Routing:
 *   chat.brain, chat.*, minion.*  → "chat"
 *   voice.stt, voice.tts          → "voice"
 *   rag.embedder, rag.reranker    → "rag"
 *   vision.*                       → "vision"
 *   unknown                        → "chat" (safe default)
 */

/**
 * Map a slot ID to its model storage subdirectory.
 */
export function slotToSubdir(slotId: string): string {
	const prefix = slotId.split(".")[0];
	const map: Record<string, string> = {
		chat: "chat",
		minion: "chat",
		voice: "voice",
		rag: "rag",
		vision: "vision",
	};
	return map[prefix] ?? "chat";
}

/**
 * Build the full relative path for a model file in its slot's directory.
 * Example: slotToModelPath("voice.stt", "ggml-small.bin") → "models/voice/ggml-small.bin"
 */
export function slotToModelPath(slotId: string, filename: string): string {
	return `models/${slotToSubdir(slotId)}/${filename}`;
}

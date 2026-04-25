/**
 * @file sys/bindings/ollama/index.ts
 * @module @devpulse/sys/bindings/ollama
 * @description Ollama IPC facade — managed `ollama serve` child process.
 *
 * Ollama is a managed child process owned by devpulse. It is the
 * **backup** inference runtime per the project's inference direction
 * (focus is llama.cpp + Burn + vLLM); Ollama is kept but never the
 * path new code reaches for. The devtool exists so the operator can
 * drive it when needed.
 *
 * # Why a facade, not direct generated imports
 *
 * Domain code stays insulated from the generated monolith — when a
 * specta type or command name changes, only this file moves.
 *
 * The Tauri command function names still carry the legacy
 * `ollama_sidecar_*` prefix (Phase 3 of the consolidation will rename
 * those). The TYPES are already canonical (`OllamaStatus`,
 * `OllamaHealth`, `OllamaConfig`, `OllamaModel`) and re-exported as-is.
 *
 * # Where the underlying Rust lives
 *
 * - Tauri commands: `interfaces/desktop/src-tauri/src/commands/ollama_sidecar/`
 *   (will move to `commands/ollama/` in Phase 3)
 * - Engine service: `systems/devpulse-engine/src/platform/services/ollama.rs`
 * - Kernel adapter: `kernel/devpulse-clyffy/src/cortex/persistence/ollama.rs`
 */

import { commands } from "$lib/sys/generated/bindings.js";

// ── Lifecycle ────────────────────────────────────────────────────

/** Boot the Ollama child process and wait for the HTTP API to respond. */
export const ollamaStart = commands.ollamaSidecarStart;

/** Stop the managed Ollama child process. */
export const ollamaStop = commands.ollamaSidecarStop;

/** Stop then start the managed Ollama child (config reload). */
export const ollamaRestart = commands.ollamaSidecarRestart;

/** Read the running-state snapshot of the managed child. */
export const ollamaStatus = commands.ollamaSidecarStatus;

/** Read the tri-state health badge for the Status tab. */
export const ollamaHealth = commands.ollamaSidecarHealth;

/** Read the user-scope Ollama config (host / port / binary path / auto-start). */
export const ollamaConfig = commands.ollamaSidecarConfig;

// ── Models ───────────────────────────────────────────────────────

/** List models reported by `GET /api/tags`. */
export const ollamaListModels = commands.ollamaSidecarListModels;

/** Pull a model by tag-qualified name (blocks until done). */
export const ollamaPullModel = commands.ollamaSidecarPullModel;

/** Delete a model from local storage. */
export const ollamaDeleteModel = commands.ollamaSidecarDeleteModel;

// ── Types ────────────────────────────────────────────────────────
//
// Already canonically named — re-exported as-is.

export type {
	OllamaConfig,
	OllamaHealth,
	OllamaHealthState,
	OllamaModel,
	OllamaStatus,
} from "$lib/sys/generated/bindings.js";

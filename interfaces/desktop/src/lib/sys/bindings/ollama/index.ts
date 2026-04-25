/**
 * @file sys/bindings/ollama/index.ts
 * @module @devpulse/sys/bindings/ollama
 * @description Ollama IPC facade — managed sidecar (backup inference path).
 *
 * Ollama is a managed sidecar child process owned by devpulse. It is
 * the **backup** inference runtime per the project's inference
 * direction (focus is llama.cpp + Burn + vLLM); Ollama is kept but
 * never the path new code reaches for. The devtool exists so the
 * operator can drive it when needed.
 *
 * # The names exposed here are the **target canonical names**
 *
 * Today the underlying generated symbols are still
 * `ollamaSidecarStart`, `ollamaSidecarStatus`, etc. — that's the
 * pre-consolidation Rust naming. This facade renames them at the
 * boundary so consumers always see `ollamaStart`, `ollamaStatus`,
 * etc. After the consolidation rename + `cargo xtask regen-bindings`,
 * only the right-hand sides in this file change. Consumers never move.
 *
 * # Where the underlying Rust lives
 *
 * - Tauri commands: `interfaces/desktop/src-tauri/src/commands/ollama_sidecar/`
 *   (will become `commands/ollama/`)
 * - Engine service: `systems/devpulse-engine/src/platform/services/ollama_sidecar.rs`
 *   (will become `services/ollama.rs`)
 * - Kernel adapter: `kernel/devpulse-clyffy/cortex/persistence/ollama/`
 *   (already correctly named — kernel owns the lifecycle)
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

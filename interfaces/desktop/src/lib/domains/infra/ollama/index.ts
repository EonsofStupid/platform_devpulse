/**
 * @module @devpulse/domains/infra/ollama
 *
 * Public API for the Ollama domain. Routes and other domains MUST import
 * from this file. Never reach into `data-access/` directly.
 *
 * Layout (Nx library-types, LOCKED 2026-04-14):
 *   data-access/  — rune state + Tauri IPC services
 *
 * Today the domain is sidecar-only. Future submodules (e.g. proxied
 * Ollama API verbs) land alongside `sidecar.{svc,state}.ts` without
 * churning consumers.
 */

export type {
	OllamaConfig,
	OllamaHealth,
	OllamaHealthState,
	OllamaModel,
	OllamaStatus,
} from "$lib/sys/bindings/ollama/index.js";
export { ollamaSidecarState } from "./data-access/sidecar.state.svelte.js";
export {
	ollamaConfig,
	ollamaDeleteModel,
	ollamaHealth,
	ollamaListModels,
	ollamaPullModel,
	ollamaRestart,
	ollamaStart,
	ollamaStatus,
	ollamaStop,
} from "./data-access/sidecar.svc.js";

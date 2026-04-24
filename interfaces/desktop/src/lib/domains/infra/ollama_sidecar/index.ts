/**
 * @module @devpulse/domains/infra/ollama_sidecar
 *
 * Public API for the Ollama sidecar devtool domain.
 */

export type {
	OllamaConfig,
	OllamaHealth,
	OllamaHealthState,
	OllamaModel,
	OllamaStatus,
} from "$lib/sys/generated/bindings.js";
export { ollamaSidecarState } from "./data-access/ollamaSidecar.state.svelte.js";
export {
	ollamaSidecarConfig,
	ollamaSidecarDeleteModel,
	ollamaSidecarHealth,
	ollamaSidecarListModels,
	ollamaSidecarPullModel,
	ollamaSidecarRestart,
	ollamaSidecarStart,
	ollamaSidecarStatus,
	ollamaSidecarStop,
} from "./data-access/ollamaSidecar.svc.js";

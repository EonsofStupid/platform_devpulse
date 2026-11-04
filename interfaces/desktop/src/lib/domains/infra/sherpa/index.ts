/**
 * @module @devpulse/domains/infra/sherpa
 *
 * Public API for the Sherpa streaming ASR devtool domain.
 */

export type {
	SherpaCompileInfo,
	SherpaInstalledModel,
	SherpaSessionInfo,
} from "#lib/sys/generated/bindings.js";
export { sherpaState } from "./data-access/sherpa.state.svelte.js";
export * from "./data-access/sherpa.svc.js";

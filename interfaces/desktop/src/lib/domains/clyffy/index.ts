/**
 * @file domains/clyffy/index.ts
 * @module @devpulse/domains/clyffy
 *
 * Clyffy frontend domain — layman-safe public surface.
 *
 * Rules:
 * - This barrel exports the USER-facing surface ONLY.
 * - DEV-gated items (cortex/, debug/, mcp/) are imported directly
 *   by devtool code using their full path, never through this file.
 *   Vite strips unused imports in customer builds.
 * - Config of Clyffy internals (grammars, guardrails, llguidance,
 *   MCP tool wiring) lives in devtools — never here.
 */

export { default as ClyffyLoadingBlock } from "./learning/ClyffyLoadingBlock.svelte";
export { default as LoadingContentCard } from "./learning/LoadingContentCard.svelte";
// ── Learning (DYK / KDROPS / T&T rotating content)
export {
	createLoadingContent,
	type LoadingContentRotator,
	loadingContent,
} from "./learning/learning.state.svelte.js";
export {
	allEntries as allLoadingContent,
	entriesByKind as loadingContentByKind,
	entriesByTag as loadingContentByTag,
	type LoadingContentEntry,
	type LoadingContentKind,
} from "./learning/loading-content.js";
export { default as ClyffyStatusOrb } from "./status/ClyffyStatusOrb.svelte";
// ── Status (presence + mood)
export {
	type ClyffyActivity,
	type ClyffyMood,
	type ClyffyStatus,
	clyffyStatus,
	createClyffyStatus,
} from "./status/clyffy.state.svelte.js";
export { default as ToolsBrowser } from "./tools/ToolsBrowser.svelte";
// ── Tools (capability catalog)
export {
	type ClyffyCapability,
	type ClyffyCapabilityGroup,
	groupCapabilities,
	listCapabilities,
} from "./tools/tools.service.js";

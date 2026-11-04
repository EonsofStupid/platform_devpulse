/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

// Feature flags
export type { FeatureFlags } from "./cfg/flags.js";
export { flags } from "./cfg/flags.js";
// Contracts
export * from "./contracts/index.js";
// Debug tools (dev-only)
export * from "./debug/index.js";
// Terminology (generated from kernel_terms.toml)
export {
	advancedLabel,
	FEATURES,
	findTerm,
	formatSimpleText,
	minionStatus,
	PERSONALITY,
	resolveLabel,
	STORE_TERMS,
	simpleLabel,
	TERMS,
} from "./generated/terminology.js";
export { getIcon } from "./generated/terminology-icons.js";
// Initialization
export { initSys, isSysInitialized } from "./init.js";
// Logger (bridges to Rust tracing)
export { log, logDebug, logError, logInfo, logWarn } from "./logger.js";
// Registries
export * from "./registries/index.js";

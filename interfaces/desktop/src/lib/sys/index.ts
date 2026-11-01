/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

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

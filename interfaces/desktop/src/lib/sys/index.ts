/**
 * @file sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

// Terminology (generated from kernel_terms.toml)
export {
	DEV_MODE,
	resolveLabel,
	devLabel,
	prodLabel,
	minionStatus,
	sanitizeForProd,
	isFeatureEnabled,
	FEATURES,
	TERMS,
	STORE_TERMS,
	PERSONALITY,
} from "./generated/terminology.js";
export { getIcon } from "./generated/terminology-icons.js";
// Debug tools (dev-only)
export * from "./debug/index.js";
// Initialization
export { initSys, isSysInitialized } from "./init.js";
// Logger (bridges to Rust tracing)
export { log, logInfo, logWarn, logError, logDebug } from "./logger.js";

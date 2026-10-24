/**
 * @file ColdLight Styles — Supporting Exports
 * @package @devpulse/coldlight
 *
 * The primary styling API is in #coldlight/renderforge.
 * This barrel exports supporting utilities (VPB state, mappings).
 */

// Global state + VPB integration
export {
	platformBase,
	registerVpbListener,
	setActiveStyle,
	updateGlobalTokens,
} from "./base-state.svelte.js";

// Type + mapping dictionary (for tooling, VPB, type safety)
export {
	type StyleMacroProps,
	type TokenMapping,
	propMappings,
	macroKeys,
	visualAxisKeys,
} from "./macro-mappings.js";

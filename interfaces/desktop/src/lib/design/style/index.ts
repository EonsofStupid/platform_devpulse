/**
 * @file ColdLight Style System — Public API
 * @package @devpulse/coldlight
 *
 * The entire visual resolution system for ColdLight.
 */

// The component
export { default as StyleMacro } from "./StyleMacro.svelte";

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
} from "./macro-mappings.js";

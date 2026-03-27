/**
 * @file ColdLight Style Macro — Public API
 * @package @devpulse/coldlight
 *
 * The ONE styling path for all ColdLight components.
 * Per MACRO-LAW.md — no second path, no escape hatches.
 *
 * @example
 * ```svelte
 * import { resolveMacro, cssVarString } from '$lib/design/style-macro';
 * const m = $derived(resolveMacro({ kind: 'button', preset }));
 * <button {...m.dataAttrs} style={cssVarString(m.cssVars)}>
 * ```
 */

// The resolver — Law 1
export { resolveMacro } from "./resolve.js";

// The format helper — the ONLY bridge to DOM
export { cssVarString } from "./css-var-string.js";

// Shared intent resolution — Law 6
export { resolveIntent, INTENT_MAP } from "./intent.js";

// Types — public contract
export type {
	MacroInput,
	MacroState,
	ResolvedMacro,
	MacroDataAttrs,
	KindString,
	CssFamily,
} from "./types.js";

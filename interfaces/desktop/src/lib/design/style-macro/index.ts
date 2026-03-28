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

// The format helper — the ONLY bridge to DOM
export { cssVarString } from "./css-var-string.js";
// Shared intent resolution — Law 6
export { INTENT_MAP, resolveIntent } from "./intent.js";
// The resolver — Law 1
export { resolveMacro } from "./resolve.js";

// Types — public contract
export type {
	CssFamily,
	KindString,
	MacroDataAttrs,
	MacroInput,
	MacroState,
	ResolvedMacro,
} from "./types.js";

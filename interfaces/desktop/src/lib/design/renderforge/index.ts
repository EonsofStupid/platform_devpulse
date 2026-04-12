/**
 * @file RenderForge — Public API
 * @package @devpulse/coldlight
 *
 * The ONE styling path for all ColdLight components.
 * Per RenderForge.md — no second path, no escape hatches.
 *
 * @example
 * ```svelte
 * import { renderForge, cssVarString } from '$lib/design/renderforge';
 * const m = $derived(renderForge({ kind: 'button', preset: 'primary' }));
 * <button {...m.dataAttrs} style={cssVarString(m.cssVars)}>
 * ```
 */

// The format helper — the ONLY bridge to DOM
export { cssVarString } from "./css-var-string.js";
// Shared intent resolution — Law 6
export { INTENT_MAP, resolveIntent } from "./intent.js";
// The resolver — Law 1
export { renderForge } from "./render.js";

// Types — public contract
export type {
	CssFamily,
	RenderState,
	ResolvedMacro,
	StyleDataAttrs,
	StyleMacro,
} from "./types.js";

/**
 * @file cssVarString — The ONLY bridge between resolver output and the DOM
 * @package @devpulse/coldlight
 *
 * Pure format function. Not a component. Not an attachment.
 * Serializes a CSS variable map to an inline style string.
 *
 * @example
 * ```svelte
 * <button style={cssVarString(m.cssVars)}>Save</button>
 * ```
 */

/**
 * Serialize a CSS custom property record to an inline style string.
 *
 * @param vars - Record of --cl-* keys to CSS values
 * @returns Semicolon-separated CSS declarations
 */
export function cssVarString(vars: Record<string, string>): string {
	let s = "";
	for (const k in vars) {
		if (s) s += ";";
		s += `${k}:${vars[k]}`;
	}
	return s;
}

/**
 * @file SVG Visual Engine — Pure Resolver
 * @package @devpulse/coldlight
 *
 * Pure functions that resolve SVG widget visual state.
 * No DOM. No components. No side effects.
 *
 * Widget calls resolveSvgMacro() in $derived, spreads result onto <svg>.
 * Two reactive layers:
 *   1. Preset (structural) — re-derives when kind or intent changes
 *   2. Accent (color) — re-derives when accent changes (3 vars, cheap)
 *
 * Uses same INTENT_MAP as HTML StyleMacro for consistency.
 */

import type { SvgAccent, SvgMacroOptions, SvgMacroResolved } from "./svg-types.js";
import { SVG_AXIS_MAP, SVG_AXIS_KEYS, SVG_PRESET_PREFIX, SVG_ACCENT_PREFIX } from "./svg-macro-mappings.js";
import { resolveIntent } from "../style-macro/intent.js";

/**
 * Accent → CSS var mapping.
 * Maps accent name to the 3 accent custom properties.
 */
const ACCENT_VARS: Record<SvgAccent, { main: string; glow: string; fill: string }> = {
	teal:    { main: "var(--accent-teal-main)",    glow: "var(--accent-teal-glow)",    fill: "var(--accent-teal-fill)" },
	purple:  { main: "var(--accent-purple-main)",  glow: "var(--accent-purple-glow)",  fill: "var(--accent-purple-fill)" },
	magenta: { main: "var(--accent-magenta-main)", glow: "var(--accent-magenta-glow)", fill: "var(--accent-magenta-fill)" },
	ember:   { main: "var(--accent-ember-main)",   glow: "var(--accent-ember-glow)",   fill: "var(--accent-ember-fill)" },
	frost:   { main: "var(--accent-frost-main)",   glow: "var(--accent-frost-glow)",   fill: "var(--accent-frost-fill)" },
	cyber:   { main: "var(--accent-cyber-main)",   glow: "var(--accent-cyber-glow)",   fill: "var(--accent-cyber-fill)" },
};

/**
 * Resolve structural preset vars (17 axes).
 * Reads --svg-style-{kind}-{visual}-{axis} from SD5 output.
 * Falls back to axis defaults for any missing property.
 *
 * @param kind - Widget kind (e.g., "radial-gauge")
 * @param intent - Semantic intent (resolved to visual preset name)
 * @returns CSS custom property string for structural axes
 */
export function resolveSvgPreset(kind: string, intent: string): string {
	const visual = resolveIntent(intent);
	const prefix = `${SVG_PRESET_PREFIX}-${kind}-${visual}`;
	const parts: string[] = [];

	SVG_AXIS_KEYS.forEach((axis) => {
		const mapping = SVG_AXIS_MAP[axis];
		parts.push(`${mapping.cssVar}: var(${prefix}-${mapping.presetKey}, ${mapping.defaultValue})`);
	});

	return parts.join("; ");
}

/**
 * Resolve accent color vars (3 vars).
 * Sets --cl-svg-accent-main, --cl-svg-accent-glow, --cl-svg-accent-fill.
 * Cheap to re-derive — only 3 string lookups.
 *
 * @param accent - Accent hue name
 * @returns CSS custom property string for accent vars
 */
export function resolveSvgAccent(accent: SvgAccent): string {
	const vars = ACCENT_VARS[accent] ?? ACCENT_VARS.teal;
	return [
		`${SVG_ACCENT_PREFIX}-main: ${vars.main}`,
		`${SVG_ACCENT_PREFIX}-glow: ${vars.glow}`,
		`${SVG_ACCENT_PREFIX}-fill: ${vars.fill}`,
	].join("; ");
}

/**
 * Full SVG macro resolver. Merges preset + accent into final output.
 *
 * Usage in widget:
 * ```svelte
 * const svg = $derived(resolveSvgMacro({ kind: "radial-gauge", intent, accent }));
 * <svg style={svg.style} {...svg.attrs}>
 * ```
 *
 * @param opts - kind, intent, accent
 * @returns Resolved style string + data attributes
 */
export function resolveSvgMacro(opts: SvgMacroOptions): SvgMacroResolved {
	const { kind, intent = "default", accent = "teal" } = opts;

	const presetStyle = resolveSvgPreset(kind, intent);
	const accentStyle = resolveSvgAccent(accent);

	return {
		style: `${accentStyle}; ${presetStyle}`,
		attrs: {
			"data-svg-kind": kind,
			"data-svg-intent": intent,
			...(accent ? { "data-svg-accent": accent } : {}),
		},
	};
}

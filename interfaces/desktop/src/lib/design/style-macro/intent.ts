/**
 * @file Shared Intent Resolution — Single Source of Truth
 * @package @devpulse/coldlight
 *
 * ONE map. ONE function. Both HTML and SVG resolvers import this.
 * Per MACRO-LAW.md Law 6.
 *
 * When the pipeline matures, INTENT_MAP becomes a generated artifact
 * from Style Dictionary — the shape stays the same, the source changes.
 */

/** Intent → visual preset name mapping */
export const INTENT_MAP: Record<string, string> = {
	// Semantic intents → visual presets
	primary: "glass",
	secondary: "matte",
	ghost: "flat",
	danger: "stark",
	default: "default",

	// Visual names pass through — they ARE presets
	glass: "glass",
	matte: "matte",
	flat: "flat",
	stark: "stark",
};

/**
 * Resolve an intent/preset string to a visual preset name.
 * Unknown values fall back to "default".
 */
export function resolveIntent(preset: string): string {
	return INTENT_MAP[preset] ?? INTENT_MAP.default;
}

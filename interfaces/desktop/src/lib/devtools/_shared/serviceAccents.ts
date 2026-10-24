/**
 * Devtool accents and backdrops — the shapes and helpers.
 *
 * Which accent and backdrop a devtool uses is declared by its own route
 * folder, in `_devtool` (`accent`, `backdrop`; see `../devtool-nav.ts`), and
 * the shell reads them from there (plan 0008). This module holds the value
 * types and the helpers that turn an accent into CSS variables and a
 * backdrop palette.
 *
 * The brand-accent names mirror the semantic-accent tokens authored
 * in [`tokens/src/semantic/accent/accent.tokens.json`] — every name
 * listed in [`BrandAccent`] is guaranteed to have a matching
 * `--accent-{name}-{main,glow,fill}` CSS variable triplet at runtime.
 */

/**
 * The set of ColdLight brand-accent token names. Each name resolves at
 * runtime to `--accent-{name}-main`, `--accent-{name}-glow`, and
 * `--accent-{name}-fill` CSS variables.
 *
 * Keep this list in sync with [`accent.tokens.json`].
 */
export type BrandAccent =
	| "teal"
	| "purple"
	| "magenta"
	| "ember"
	| "frost"
	| "cyber"
	| "cyan"
	| "green"
	| "hotpink"
	| "coral"
	| "blue"
	| "salmon"
	| "gold"
	| "violet"
	| "electric"
	| "azure";

/** Accent for a devtool whose folder declares none. Teal is the historical neutral. */
export const DEFAULT_SERVICE_ACCENT: BrandAccent = "teal";

/**
 * A devtool's ambient BackgroundScene — variation, intensity and speed. Its
 * palette derives from the devtool's accent (`accentToBackdropPalette`), so
 * colour stays family-coherent.
 */
export interface ServiceBackdrop {
	variation: "circuit-drift" | "neural-pulse" | "void-breathe" | "chrome-flow" | "cosmic-galaxy";
	/** Subtle (0.06) / normal (0.12) / strong (0.18) — opacity scaling. */
	intensity: "subtle" | "normal" | "strong";
	/** Slow (25s) / normal (15s) / fast (8s) animation period. */
	speed: "slow" | "normal" | "fast";
}

/**
 * Map a [`BrandAccent`] to a [`Palette`] the BackgroundScene understands.
 * The accent palette is broader than the BG palette, so several accents
 * share a backdrop palette family. Keeps the colour family coherent
 * between the per-tab accent and the ambient backdrop.
 */
export function accentToBackdropPalette(
	accent: BrandAccent,
): "teal" | "purple" | "ember" | "cyber" | "frost" | "magenta" | "cosmic" {
	switch (accent) {
		case "teal":
		case "frost":
		case "cyan":
		case "azure":
		case "blue":
			return "teal";
		case "purple":
		case "violet":
		case "electric":
			return "cosmic";
		case "magenta":
		case "hotpink":
			return "magenta";
		case "ember":
		case "salmon":
		case "coral":
		case "gold":
			return "ember";
		case "cyber":
		case "green":
			return "cyber";
		default:
			return "cosmic";
	}
}

/**
 * Build the inline-style CSS-variable triplet that scopes
 * `--accent-service-{main,glow,fill}` to a brand accent. The shell
 * applies this to its root element so descendants can consume
 * `var(--accent-service-main)` without knowing the brand name.
 *
 * Returned shape is intentionally a string ready to drop into a
 * `style={...}` attribute — Svelte's inline-style escaping handles
 * the rest.
 */
export function serviceAccentStyle(accent: BrandAccent): string {
	return [
		`--accent-service-main: var(--accent-${accent}-main)`,
		`--accent-service-glow: var(--accent-${accent}-glow)`,
		`--accent-service-fill: var(--accent-${accent}-fill)`,
	].join("; ");
}

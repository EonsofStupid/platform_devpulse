/**
 * @file renderForge — The ONE public styling path
 * @package @devpulse/coldlight
 *
 * Pure function. Same input → same output, always.
 * No DOM. No context. No side effects. Testable without a browser.
 *
 * Per RenderForge.md Law 1.
 *
 * ═══════════════════════════════════════════════════════════════
 * CANONICAL AXIS REGISTRY — 20 axes, 6 families
 * ═══════════════════════════════════════════════════════════════
 *
 * Canonical names only. Full CSS property names or design-industry terms.
 * Each var name here MUST have a matching consumer in render-base.css.
 *
 * SURFACE family:
 *   --background-color     Fill              background-color
 *   --box-shadow           Elevation         box-shadow
 *   --border-color         Stroke Color      border-color
 *   --gradient             Gradient Fill     background-image
 *   --background-image     Surface Image     background-image
 *   --background-alpha     Fill Opacity      oklch alpha channel
 *
 * FRAME family:
 *   --border-width         Stroke Width      border-width
 *   --border-style         Stroke Style      border-style
 *   --border-radius        Corner Radius     border-radius
 *
 * TEXT family:
 *   --color                Foreground        color
 *   --font-family          Typeface          font-family
 *   --font-size            Size              font-size
 *   --font-weight          Weight            font-weight
 *   --tracking             Tracking          letter-spacing
 *   --leading              Leading           line-height
 *
 * OVERLAY family:
 *   --backdrop-filter      Glass Blur        backdrop-filter
 *
 * MOTION (universal, not family-gated):
 *   --opacity              Opacity           opacity
 *   --animation            Animation         animation
 *   --transition-duration  Duration          transition-duration
 *   --transition-timing    Easing            transition-timing-function
 *
 * Resolution chain (most specific first):
 *   var(--preset-{kind}-{intent}-{axis},   ← kind + semantic intent (e.g.
 *                                            --preset-button-primary-*), only
 *                                            when `preset` is an intent
 *       var(--style-{kind}-{preset}-{axis},    ← per-kind VPB override
 *           var(--preset-{preset}-{axis},      ← shared preset default
 *               {fallback})))                   ← absolute fallback
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { renderForge, cssVarString } from '#coldlight/renderforge';
 *   let { preset = 'primary', disabled = false, children } = $props();
 *   const state = $derived(disabled ? 'disabled' : 'default');
 *   const m = $derived(renderForge({ kind: 'button', preset, state }));
 * </script>
 * <button {...m.dataAttrs} style={cssVarString(m.cssVars)} {disabled}>
 *   {@render children()}
 * </button>
 * ```
 */

import { KIND_FAMILIES } from "./generated/kind-families.js";
import { resolveIntent } from "./intent.js";
import type { CssFamily, ResolvedMacro, StyleDataAttrs, StyleMacro } from "./types.js";

/** Default families applied when KIND_FAMILIES entry is missing */
const DEFAULT_FAMILIES: CssFamily[] = ["surface", "text", "frame"];

/**
 * Resolve a component's visual state.
 *
 * @param input - kind, preset, state
 * @returns Sealed ResolvedMacro — dataAttrs + cssVars
 */
export function renderForge(input: StyleMacro): ResolvedMacro {
	const { kind, preset = "primary", state = "default" } = input;

	const resolved = resolveIntent(preset);

	const perKind = `--style-${kind}-${resolved}`;
	const shared = `--preset-${resolved}`;
	// A semantic intent ("primary") may have tokens authored for this kind
	// (`--preset-button-primary-*`); they win. A compound preset id
	// ("glass-deep") has none.
	const kindIntent = preset === resolved ? null : `--preset-${kind}-${preset}`;

	/** Build a var() chain: kind+intent → per-kind override → shared preset → fallback */
	const v = (axis: string, fallback: string): string => {
		const base = `var(${perKind}-${axis}, var(${shared}-${axis}, ${fallback}))`;
		return kindIntent ? `var(${kindIntent}-${axis}, ${base})` : base;
	};

	// ── 20 Canonical Axes ─────────────────────────────────
	const cssVars: Record<string, string> = {
		// SURFACE (6)
		"--background-color": v("background-color", "transparent"),
		"--box-shadow": v("box-shadow", "none"),
		"--border-color": v("border-color", "transparent"),
		"--gradient": v("gradient", "none"),
		"--background-image": v("background-image", "none"),
		"--background-alpha": v("background-alpha", "1"),

		// FRAME (3)
		"--border-width": v("border-width", "0"),
		"--border-style": "solid",
		"--border-radius": v("border-radius", "0"),

		// TEXT (6)
		"--color": v("color", "inherit"),
		"--font-family": v("font-family", "inherit"),
		"--font-size": v("font-size", "inherit"),
		"--font-weight": v("font-weight", "inherit"),
		"--tracking": v("letter-spacing", "0"),
		"--leading": v("line-height", "inherit"),

		// OVERLAY (1)
		"--backdrop-filter": v("backdrop-filter", "none"),

		// MOTION (4)
		"--opacity": v("opacity", "1"),
		"--animation": v("animation", "none"),
		"--transition-duration": v("transition-duration", "150ms"),
		"--transition-timing": v("transition-timing-function", "ease-out"),
	};

	// State overrides
	if (state !== "default") {
		const sv = (axis: string, fallback: string): string =>
			`var(${shared}-${state}-${axis}, ${v(axis, fallback)})`;

		cssVars["--background-color"] = sv("background-color", "transparent");
		cssVars["--box-shadow"] = sv("box-shadow", cssVars["--box-shadow"]);
		cssVars["--color"] = sv("color", "inherit");
		cssVars["--opacity"] = sv("opacity", "1");
		cssVars["--border-color"] = sv("border-color", v("border-color", "transparent"));
		cssVars["--border-width"] = sv("border-width", v("border-width", "0"));
		cssVars["--animation"] = sv("animation", v("animation", "none"));
		cssVars["--gradient"] = sv("gradient", v("gradient", "none"));
	}

	const families: CssFamily[] = KIND_FAMILIES[kind] ?? DEFAULT_FAMILIES;

	const dataAttrs = { "data-kind": kind } as StyleDataAttrs;
	families.forEach((fam) => {
		(dataAttrs as unknown as Record<string, string>)[`data-cl-${fam}`] = "";
	});

	return { kind, dataAttrs, cssVars };
}

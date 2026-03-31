/**
 * @file resolveMacro — The ONE public styling path
 * @package @devpulse/coldlight
 *
 * Pure function. Same input → same output, always.
 * No DOM. No context. No side effects. Testable without a browser.
 *
 * Per MACRO-LAW.md Law 1.
 *
 * Pipeline:
 *   Component: preset="neuro-elevated"
 *   → resolveMacro({ kind: "button", preset: "neuro-elevated" })
 *   → resolves preset → concrete PresetId via visual system
 *   → assembles --cl-* vars as var(--style-button-neuro-elevated-*) references
 *   → returns { kind, dataAttrs, cssVars }
 *   → component applies: style={cssVarString(m.cssVars)} {...m.dataAttrs}
 *   → macro-base.css family selectors paint from --cl-* vars
 *   → browser paints
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { resolveMacro, cssVarString } from '$lib/design/style-macro';
 *   let { preset = 'primary', disabled = false, children } = $props();
 *   const state = $derived(disabled ? 'disabled' : 'default');
 *   const m = $derived(resolveMacro({ kind: 'button', preset, state }));
 * </script>
 * <button {...m.dataAttrs} style={cssVarString(m.cssVars)} {disabled}>
 *   {@render children()}
 * </button>
 * ```
 */

import { resolveIntent } from "./intent.js";
import type { CssFamily, MacroDataAttrs, MacroInput, ResolvedMacro } from "./types.js";

// ═══════════════════════════════════════════════════════════════
// KIND_FAMILIES — generated at build time by deriveKindFamilies
// ═══════════════════════════════════════════════════════════════

import { KIND_FAMILIES } from "./generated/kind-families.js";

/** Default families applied when KIND_FAMILIES entry is missing */
const DEFAULT_FAMILIES: CssFamily[] = ["surface", "text", "frame"];

// ═══════════════════════════════════════════════════════════════
// RESOLVER
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve a component's visual state.
 *
 * Reads SD5-generated --style-{kind}-{preset}-{axis} tokens via var() chains.
 * Assembles --cl-* CSS custom properties for macro-base.css to consume.
 * Derives data-cl-* family attributes for targeted glue CSS.
 *
 * @param input - kind, preset, state
 * @returns Sealed ResolvedMacro — dataAttrs + cssVars
 */
export function resolveMacro(input: MacroInput): ResolvedMacro {
	const { kind, preset = "primary", state = "default" } = input;

	// Resolve preset through typed intent map → concrete PresetId
	const resolved = resolveIntent(preset);

	// Two-tier var() resolution:
	//   1. Per-kind override: --style-{kind}-{preset}-{axis} (VPB custom, may not exist)
	//   2. Shared preset:     --preset-{preset}-{axis} (always exists, default for all kinds)
	const perKind = `--style-${kind}-${resolved}`;
	const shared = `--preset-${resolved}`;

	/** Build a var() chain: per-kind override → shared preset → fallback */
	const v = (axis: string, fallback: string): string =>
		`var(${perKind}-${axis}, var(${shared}-${axis}, ${fallback}))`;

	// Assemble CSS var references — one var per CSS property, NO shorthand
	const cssVars: Record<`--cl-${string}`, string> = {
		"--cl-bg": v("background-color", "transparent"),
		"--cl-shadow": v("box-shadow", "none"),
		"--cl-border-color": v("border-color", "transparent"),
		"--cl-border-width": v("border-width", "0"),
		"--cl-border-style": "solid",
		"--cl-color": v("color", "inherit"),
		"--cl-fg": v("color", "inherit"),
		"--cl-radius": v("border-radius", "0"),
		"--cl-opacity": v("opacity", "1"),
		"--cl-font-family": v("font-family", "inherit"),
		"--cl-font-size": v("font-size", "inherit"),
		"--cl-font-weight": v("font-weight", "inherit"),
		"--cl-letter-spacing": v("letter-spacing", "0"),
		"--cl-line-height": v("line-height", "inherit"),
		"--cl-gradient": v("gradient", "none"),
		"--cl-backdrop": v("backdrop-filter", "none"),
		"--cl-animation": v("animation", "none"),
		"--cl-transition-duration": v("transition-duration", "150ms"),
		"--cl-transition-easing": v("transition-timing-function", "ease-out"),
		"--cl-bg-image": v("background-image", "none"),
		"--cl-bg-alpha": v("background-alpha", "1"),
	};

	// State overrides — read from shared preset state vars
	if (state !== "default") {
		const sv = (axis: string, fallback: string): string =>
			`var(${shared}-${state}-${axis}, ${v(axis, fallback)})`;

		cssVars["--cl-bg"] = sv("background-color", "transparent");
		cssVars["--cl-shadow"] = sv("box-shadow", cssVars["--cl-shadow"]);
		cssVars["--cl-color"] = sv("color", "inherit");
		cssVars["--cl-fg"] = sv("color", "inherit");
		cssVars["--cl-opacity"] = sv("opacity", "1");
		cssVars["--cl-border-color"] = sv("border-color", v("border-color", "transparent"));
		cssVars["--cl-border-width"] = sv("border-width", v("border-width", "0"));
		cssVars["--cl-animation"] = sv("animation", v("animation", "none"));
		cssVars["--cl-gradient"] = sv("gradient", v("gradient", "none"));
	}

	// Derive families from KIND_FAMILIES (build-time) or fall back to defaults
	const families: CssFamily[] = KIND_FAMILIES[kind] ?? DEFAULT_FAMILIES;

	// Build data attributes — data-kind + data-cl-{family} markers
	const dataAttrs = { "data-kind": kind } as MacroDataAttrs;
	families.forEach((fam) => {
		(dataAttrs as unknown as Record<string, string>)[`data-cl-${fam}`] = "";
	});

	return { kind, dataAttrs, cssVars };
}

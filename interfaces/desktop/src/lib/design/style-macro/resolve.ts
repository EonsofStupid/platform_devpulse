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
 *   Component: preset="glass"
 *   → resolveMacro({ kind: "button", preset: "glass" })
 *   → resolves preset → visual name via INTENT_MAP
 *   → assembles --cl-* vars as var(--style-button-glass-*) references
 *   → returns { kind, dataAttrs, cssVars }
 *   → component applies: style={cssVarString(m.cssVars)} {...m.dataAttrs}
 *   → macro-base.css family selectors paint from --cl-* vars
 *   → browser paints
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { resolveMacro, cssVarString } from '$lib/design/style-macro';
 *   let { preset = 'default', disabled = false, children } = $props();
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
// Until the build step exists, fall back to all families.
// ═══════════════════════════════════════════════════════════════

import { KIND_FAMILIES } from "./generated/kind-families.js";

/** Default families applied when KIND_FAMILIES is not available */
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
	const { kind, preset = "default", state = "default" } = input;

	// Resolve preset name through intent map (glass, matte, etc.)
	const visual = resolveIntent(preset);
	const p = `--style-${kind}-${visual}`;

	// Assemble CSS var references — SD5 CSS on :root provides values
	const cssVars: Record<`--cl-${string}`, string> = {
		"--cl-bg": `var(${p}-background-color, transparent)`,
		"--cl-shadow": `var(${p}-box-shadow, none)`,
		"--cl-border": `var(${p}-border-width, 0) solid var(${p}-border-color, transparent)`,
		"--cl-color": `var(${p}-color, inherit)`,
		"--cl-fg": `var(${p}-color, inherit)`,
		"--cl-radius": `var(${p}-border-radius, 0)`,
		"--cl-opacity": `var(${p}-opacity, 1)`,
		"--cl-font-family": `var(${p}-font-family, inherit)`,
		"--cl-font-size": `var(${p}-font-size, inherit)`,
		"--cl-font-weight": `var(${p}-font-weight, inherit)`,
		"--cl-letter-spacing": `var(${p}-letter-spacing, 0)`,
		"--cl-line-height": `var(${p}-line-height, inherit)`,
		"--cl-gradient": `var(${p}-gradient, none)`,
		"--cl-backdrop": `blur(var(${p}-backdrop-filter, 0))`,
		"--cl-animation": `var(${p}-animation, none)`,
		"--cl-transition-duration": `var(${p}-transition-duration, 150ms)`,
		"--cl-transition-easing": `var(${p}-transition-timing-function, ease-out)`,
	};

	// State overrides — disabled gets muted values
	if (state === "disabled") {
		cssVars["--cl-opacity"] = `var(${p}-disabled-opacity, 0.5)`;
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

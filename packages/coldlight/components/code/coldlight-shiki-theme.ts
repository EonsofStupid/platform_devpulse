/**
 * @file ColdLight Shiki Theme
 * @kind code
 * @layer components
 * @package @devpulse/coldlight
 *
 * Shiki CSS Variables theme for ColdLight.
 * Uses `createCssVariablesTheme()` from Shiki — outputs HTML that references
 * CSS custom properties instead of inline hex colors.
 *
 * The browser resolves `--shiki-*` vars at render time from the ColdLight
 * token pipeline. Define these vars in CSS on [data-kind="code"] or :root.
 *
 * Color mapping strategy (ColdLight accent system):
 *   --shiki-foreground          → text-primary (neutral warm white)
 *   --shiki-background          → void-base (deep dark teal-tinted)
 *   --shiki-token-keyword       → teal-400 (primary accent)
 *   --shiki-token-string        → amber-300 (warm contrast)
 *   --shiki-token-string-expression → amber-300
 *   --shiki-token-comment       → neutral-500 (muted)
 *   --shiki-token-function      → frost-400 (cool contrast)
 *   --shiki-token-constant      → magenta-400 (numbers, booleans)
 *   --shiki-token-parameter     → neutral-200 (subtle distinction)
 *   --shiki-token-punctuation   → neutral-400 (structural)
 *   --shiki-token-link          → text-link (teal-400)
 *
 * Token source: theme/color.css (SD5 auto-generated, DTCG compliant, oklch)
 */

import { createCssVariablesTheme } from "shiki/core";

// =============================================================================
// THEME FACTORY
// =============================================================================

/**
 * ColdLight CSS Variables theme for Shiki.
 *
 * Shiki outputs `style="color: var(--shiki-token-keyword)"` etc.
 * ColdLight's CSS maps those vars to token pipeline values.
 */
export const coldlightTheme = createCssVariablesTheme({
	name: "coldlight",
	variablePrefix: "--shiki-",
	variableDefaults: {},
	fontStyle: true,
});

// =============================================================================
// CSS VARIABLE DEFINITIONS
// =============================================================================

/**
 * CSS custom properties that map Shiki's output to ColdLight tokens.
 *
 * These MUST be defined in CSS for the theme to render correctly.
 * The code composition injects these on [data-kind="code"].
 */
export const COLDLIGHT_SHIKI_CSS_VARS = {
	"--shiki-foreground": "var(--text-primary)",
	"--shiki-background": "var(--color-void-base)",
	"--shiki-token-constant": "var(--color-magenta-400)",
	"--shiki-token-string": "var(--color-amber-300)",
	"--shiki-token-comment": "var(--color-neutral-500)",
	"--shiki-token-keyword": "var(--color-teal-400)",
	"--shiki-token-parameter": "var(--color-neutral-200)",
	"--shiki-token-function": "var(--color-frost-400)",
	"--shiki-token-string-expression": "var(--color-amber-300)",
	"--shiki-token-punctuation": "var(--color-neutral-400)",
	"--shiki-token-link": "var(--text-link)",
} as const;

/**
 * ANSI color mappings for terminal output highlighting (lang: 'ansi').
 * Maps to ColdLight accent and tone tokens.
 */
export const COLDLIGHT_SHIKI_ANSI_VARS = {
	"--shiki-ansi-black": "var(--color-neutral-950)",
	"--shiki-ansi-red": "var(--color-red-500)",
	"--shiki-ansi-green": "var(--color-green-500)",
	"--shiki-ansi-yellow": "var(--color-yellow-500)",
	"--shiki-ansi-blue": "var(--color-azure-500)",
	"--shiki-ansi-magenta": "var(--color-magenta-500)",
	"--shiki-ansi-cyan": "var(--color-teal-400)",
	"--shiki-ansi-white": "var(--color-neutral-100)",
	"--shiki-ansi-bright-black": "var(--color-neutral-600)",
	"--shiki-ansi-bright-red": "var(--color-red-400)",
	"--shiki-ansi-bright-green": "var(--color-green-400)",
	"--shiki-ansi-bright-yellow": "var(--color-yellow-400)",
	"--shiki-ansi-bright-blue": "var(--color-azure-400)",
	"--shiki-ansi-bright-magenta": "var(--color-magenta-400)",
	"--shiki-ansi-bright-cyan": "var(--color-teal-300)",
	"--shiki-ansi-bright-white": "var(--color-white)",
} as const;

// =============================================================================
// CSS GENERATION
// =============================================================================

/**
 * Generate a complete CSS block with all ColdLight Shiki variables.
 * Inject this into your stylesheet or use the code composition.
 *
 * ```ts
 * const css = coldlightShikiCss();
 * // → `[data-kind="code"] { --shiki-foreground: var(--color-text-primary); ... }`
 * ```
 */
export function coldlightShikiCss(selector = '[data-kind="code"]'): string {
	const allVars = { ...COLDLIGHT_SHIKI_CSS_VARS, ...COLDLIGHT_SHIKI_ANSI_VARS };
	const vars = Object.entries(allVars)
		.map(([key, value]) => `  ${key}: ${value};`)
		.join("\n");
	return `${selector} {\n${vars}\n}`;
}

// =============================================================================
// FALLBACK RESOLVED VALUES (for SSR / non-browser contexts)
// =============================================================================

/**
 * Hardcoded oklch fallbacks from SD5 output.
 * Use when CSS vars aren't available (SSR, static export, tests).
 */
export const COLDLIGHT_SHIKI_FALLBACKS = {
	foreground: "oklch(0.9441 0.0174 210.19)",
	background: "oklch(0.1611 0.0350 162.75)",
	keyword: "oklch(0.6596 0.1227 176.57)",
	string: "oklch(0.8420 0.1076 91.32)",
	comment: "oklch(0.5278 0.0000 0.00)",
	function: "oklch(0.6584 0.1275 227.31)",
	type: "oklch(0.6050 0.2421 315.99)",
	constant: "oklch(0.6614 0.2589 328.02)",
	tag: "oklch(0.6398 0.1593 24.89)",
	regex: "oklch(0.6444 0.1506 158.04)",
	error: "oklch(0.6052 0.1990 25.43)",
	punctuation: "oklch(0.6500 0.0000 0.00)",
} as const;

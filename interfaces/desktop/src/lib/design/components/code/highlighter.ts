/**
 * @file ColdLight Shiki Highlighter Utility
 * @kind code
 * @layer components
 * @package @devpulse/coldlight
 *
 * Thin wrapper around Shiki's createHighlighter that pre-loads
 * the ColdLight CSS variables theme and common languages.
 *
 * Usage:
 * ```ts
 * import { createColdLightHighlighter } from "$lib/design/components/code/highlighter.js";
 *
 * const highlighter = await createColdLightHighlighter();
 * const html = highlighter.highlight("const x = 42;", "typescript");
 * ```
 *
 * CSS: Ensure ColdLight Shiki CSS vars are defined on [data-kind="code"].
 * The code composition handles this, or call coldlightShikiCss() to generate.
 */

import type { BundledLanguage, BundledTheme, HighlighterGeneric } from "shiki";
import {
	COLDLIGHT_SHIKI_CSS_VARS,
	coldlightShikiCss,
	coldlightTheme,
} from "./coldlight-shiki-theme.js";
import type { CodeLanguage } from "./types.js";

// =============================================================================
// TYPES
// =============================================================================

export interface ColdLightHighlighter {
	/** Highlight code string → HTML string. */
	highlight: (code: string, language: CodeLanguage) => string;
	/** Get the raw Shiki highlighter instance for advanced use. */
	readonly instance: HighlighterGeneric<BundledLanguage, BundledTheme>;
	/** Dispose the highlighter (free WASM memory). */
	dispose: () => void;
}

export interface CreateHighlighterOptions {
	/** Additional languages to preload beyond defaults. */
	languages?: CodeLanguage[];
}

/** Default languages to preload. */
const DEFAULT_LANGUAGES: CodeLanguage[] = [
	"typescript",
	"javascript",
	"rust",
	"svelte",
	"html",
	"css",
	"json",
	"shell",
	"bash",
	"markdown",
	"sql",
	"python",
	"yaml",
	"toml",
];

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a ColdLight-themed Shiki highlighter.
 *
 * Uses Shiki's CSS variables theme — output references `--shiki-*` vars
 * that ColdLight's token pipeline resolves at render time.
 *
 * ```ts
 * const hl = await createColdLightHighlighter();
 * const html = hl.highlight(code, "typescript");
 * // Inject into CodeBlock.Content: {@html html}
 * ```
 */
export async function createColdLightHighlighter(
	options: CreateHighlighterOptions = {},
): Promise<ColdLightHighlighter> {
	const { languages = [] } = options;

	// Dynamic import — Shiki is heavy, only load when needed
	const { createHighlighter } = await import("shiki");

	const allLanguages = [...new Set([...DEFAULT_LANGUAGES, ...languages])];

	const highlighter = await createHighlighter({
		themes: [coldlightTheme],
		langs: allLanguages,
	});

	function highlight(code: string, language: CodeLanguage): string {
		return highlighter.codeToHtml(code, {
			lang: language,
			theme: "coldlight",
		});
	}

	return {
		highlight,
		get instance() {
			return highlighter;
		},
		dispose() {
			highlighter.dispose();
		},
	};
}

// Re-export CSS utilities
export { COLDLIGHT_SHIKI_CSS_VARS, coldlightShikiCss };

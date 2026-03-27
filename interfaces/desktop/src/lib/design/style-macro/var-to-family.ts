/**
 * @file VAR_TO_FAMILY — CSS variable → family mapping
 * @package @devpulse/coldlight
 *
 * Hand-authored, stable. Maps each --cl-* CSS custom property
 * to its visual family. Used by deriveKindFamilies at build time
 * to determine which data-cl-* attrs a kind needs.
 *
 * Per MACRO-LAW.md Law 5.
 */

import type { CssFamily } from "./types.js";

/** Map of --cl-* variable name → visual family */
export const VAR_TO_FAMILY: Record<string, CssFamily> = {
	// Surface: background, borders, shadows
	"--cl-bg": "surface",
	"--cl-border": "surface",
	"--cl-shadow": "surface",

	// Text: typography properties
	"--cl-fg": "text",
	"--cl-color": "text",
	"--cl-font-family": "text",
	"--cl-font-size": "text",
	"--cl-tracking": "text",
	"--cl-letter-spacing": "text",
	"--cl-leading": "text",
	"--cl-line-height": "text",
	"--cl-font-weight": "text",

	// Frame: dimensional properties
	"--cl-radius": "frame",
	"--cl-border-width": "frame",
	"--cl-border-style": "frame",
	"--cl-padding-x": "frame",
	"--cl-padding-y": "frame",

	// Interactive: behavioral visual properties
	"--cl-interactive": "interactive",
	"--cl-focus-ring": "interactive",
	"--cl-focus-offset": "interactive",
	"--cl-hover-filter": "interactive",
	"--cl-active-filter": "interactive",

	// Layout: spacing and flow
	"--cl-gap": "layout",

	// Overlay: layering and backdrop
	"--cl-backdrop": "overlay",
	"--cl-blur": "overlay",
	"--cl-z": "overlay",
};

/** All family names in display order */
export const ALL_FAMILIES: CssFamily[] = [
	"surface",
	"text",
	"frame",
	"interactive",
	"layout",
	"overlay",
];

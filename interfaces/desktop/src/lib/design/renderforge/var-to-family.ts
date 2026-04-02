/**
 * @file AXIS_REGISTRY + VAR_TO_FAMILY — Canonical axis definitions
 * @package @devpulse/coldlight
 *
 * ═══════════════════════════════════════════════════════════════
 * SSOT for the 20-axis visual system. Three tiers per axis:
 *   1. Design Term  → what designers say (Fill, Tracking, Leading)
 *   2. CSS Var      → what code writes (--background-color, --tracking)
 *   3. CSS Property → what browser paints (background-color, letter-spacing)
 *
 * Canonical names only. Must match resolve.ts and macro-base.css EXACTLY.
 * Per RenderForge.md Law 5.
 * ═══════════════════════════════════════════════════════════════
 */

import type { CssFamily } from "./types.js";

/** Axis definition — the triple-mapping for code, design, and layman */
export interface AxisDefinition {
	/** CSS custom property name (what code writes) */
	cssVar: string;
	/** CSS property it maps to (what browser paints) */
	cssProperty: string;
	/** Visual family grouping */
	family: CssFamily;
	/** Design term (what designers say) */
	designLabel: string;
	/** Layman term (what VPB shows in simple mode) */
	laymanLabel: string;
	/** Short description for tooltips */
	description: string;
}

/** The 20 canonical axes — SSOT for the entire visual system */
export const AXIS_REGISTRY: Record<string, AxisDefinition> = {
	// ── SURFACE (6) ─────────────────────────────────────────
	"--background-color": {
		cssVar: "--background-color",
		cssProperty: "background-color",
		family: "surface",
		designLabel: "Fill",
		laymanLabel: "Background Color",
		description: "Surface fill color",
	},
	"--box-shadow": {
		cssVar: "--box-shadow",
		cssProperty: "box-shadow",
		family: "surface",
		designLabel: "Elevation",
		laymanLabel: "Shadow & Depth",
		description: "Depth shadows, bevel, glow layers",
	},
	"--border-color": {
		cssVar: "--border-color",
		cssProperty: "border-color",
		family: "surface",
		designLabel: "Stroke Color",
		laymanLabel: "Border Color",
		description: "Border/stroke color",
	},
	"--gradient": {
		cssVar: "--gradient",
		cssProperty: "background-image",
		family: "surface",
		designLabel: "Gradient Fill",
		laymanLabel: "Gradient",
		description: "Gradient overlay on surface",
	},
	"--background-image": {
		cssVar: "--background-image",
		cssProperty: "background-image",
		family: "surface",
		designLabel: "Surface Image",
		laymanLabel: "Background Image",
		description: "Background image or texture",
	},
	"--background-alpha": {
		cssVar: "--background-alpha",
		cssProperty: "opacity",
		family: "surface",
		designLabel: "Fill Opacity",
		laymanLabel: "Background Transparency",
		description: "Background layer alpha channel",
	},

	// ── FRAME (3) ───────────────────────────────────────────
	"--border-width": {
		cssVar: "--border-width",
		cssProperty: "border-width",
		family: "frame",
		designLabel: "Stroke Width",
		laymanLabel: "Border Thickness",
		description: "Border thickness",
	},
	"--border-style": {
		cssVar: "--border-style",
		cssProperty: "border-style",
		family: "frame",
		designLabel: "Stroke Style",
		laymanLabel: "Border Style",
		description: "Border line style (solid, dashed, etc.)",
	},
	"--border-radius": {
		cssVar: "--border-radius",
		cssProperty: "border-radius",
		family: "frame",
		designLabel: "Corner Radius",
		laymanLabel: "Roundness",
		description: "Corner rounding",
	},

	// ── TEXT (6) ─────────────────────────────────────────────
	"--color": {
		cssVar: "--color",
		cssProperty: "color",
		family: "text",
		designLabel: "Foreground",
		laymanLabel: "Text Color",
		description: "Text/icon foreground color",
	},
	"--font-family": {
		cssVar: "--font-family",
		cssProperty: "font-family",
		family: "text",
		designLabel: "Typeface",
		laymanLabel: "Font",
		description: "Font family",
	},
	"--font-size": {
		cssVar: "--font-size",
		cssProperty: "font-size",
		family: "text",
		designLabel: "Size",
		laymanLabel: "Text Size",
		description: "Font size",
	},
	"--font-weight": {
		cssVar: "--font-weight",
		cssProperty: "font-weight",
		family: "text",
		designLabel: "Weight",
		laymanLabel: "Text Weight",
		description: "Font weight (light, regular, bold, etc.)",
	},
	"--tracking": {
		cssVar: "--tracking",
		cssProperty: "letter-spacing",
		family: "text",
		designLabel: "Tracking",
		laymanLabel: "Letter Spacing",
		description: "Space between letters",
	},
	"--leading": {
		cssVar: "--leading",
		cssProperty: "line-height",
		family: "text",
		designLabel: "Leading",
		laymanLabel: "Line Height",
		description: "Space between lines of text",
	},

	// ── OVERLAY (1) ─────────────────────────────────────────
	"--backdrop-filter": {
		cssVar: "--backdrop-filter",
		cssProperty: "backdrop-filter",
		family: "overlay",
		designLabel: "Glass Blur",
		laymanLabel: "Glass Effect",
		description: "Background blur for glass surfaces",
	},

	// ── MOTION (4) ──────────────────────────────────────────
	"--opacity": {
		cssVar: "--opacity",
		cssProperty: "opacity",
		family: "overlay",
		designLabel: "Opacity",
		laymanLabel: "Transparency",
		description: "Element transparency",
	},
	"--animation": {
		cssVar: "--animation",
		cssProperty: "animation",
		family: "overlay",
		designLabel: "Animation",
		laymanLabel: "Animation",
		description: "CSS animation shorthand",
	},
	"--transition-duration": {
		cssVar: "--transition-duration",
		cssProperty: "transition-duration",
		family: "overlay",
		designLabel: "Duration",
		laymanLabel: "Speed",
		description: "How fast transitions happen",
	},
	"--transition-timing": {
		cssVar: "--transition-timing",
		cssProperty: "transition-timing-function",
		family: "overlay",
		designLabel: "Easing",
		laymanLabel: "Easing",
		description: "Transition acceleration curve",
	},
};

/** Flat map: var name → family (used by deriveKindFamilies at build time) */
export const VAR_TO_FAMILY: Record<string, CssFamily> = Object.fromEntries(
	Object.values(AXIS_REGISTRY).map((a) => [a.cssVar, a.family]),
);

/** All family names in display order */
export const ALL_FAMILIES: CssFamily[] = [
	"surface",
	"text",
	"frame",
	"interactive",
	"layout",
	"overlay",
];

/** All canonical axis CSS var names */
export const ALL_AXIS_VARS: string[] = Object.keys(AXIS_REGISTRY);

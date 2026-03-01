/**
 * @file Tier 1 Token Barrel — re-exports from organized source files
 * @module @devpulse/coldlight/tokens
 * @layer tokens/tier-1
 *
 * This file re-exports all Tier 1 global tokens from their organized source files.
 * The SD5 build pipeline loads this file via jiti.
 *
 * Source organization:
 *   color/     — palettes, surfaces, text, signals
 *   spacing/   — space scale, padding
 *   effects/   — shadow, bevel, glow, blur
 *   motion/    — duration, easing, keyframes
 *   typography/ — fonts, text sizes
 *   layout/    — radius, z-index
 *
 * DO NOT add token definitions here. Add them to the appropriate source file.
 * Run `pnpm ds:tokens:build` to regenerate CSS from these sources.
 */

// ── Color ────────────────────────────────────────────────────────────────────
export { hue, color } from "./color/scales.js";
export { glass, matte } from "./color/surfaces.js";
export { text } from "./color/text.js";
export { signal } from "./color/signals.js";

// ── Spacing ──────────────────────────────────────────────────────────────────
export { space, padding } from "./spacing/space.js";

// ── Effects ──────────────────────────────────────────────────────────────────
export { shadow } from "./effects/shadow.js";
export { bevel } from "./effects/bevel.js";
export { glow, glowSpread } from "./effects/glow.js";
export { blur } from "./effects/blur.js";

// ── Motion ───────────────────────────────────────────────────────────────────
export { duration } from "./motion/duration.js";
export { ease } from "./motion/easing.js";
export { animation, keyframesDef } from "./motion/keyframes.js";

// ── Typography ───────────────────────────────────────────────────────────────
export { font } from "./typography/fonts.js";
export { textSize } from "./typography/sizes.js";

// ── Layout ───────────────────────────────────────────────────────────────────
export { radius } from "./layout/radius.js";
export { z } from "./layout/z-index.js";

// ── Enums (derived from token keys — consumed by types.ts generator) ─────────
// These are generated from the source files above. When you add a token,
// add its key here too. In a future pass, these will be auto-derived.
export const enums = {
	accent: ["teal", "purple", "magenta", "ember", "frost", "cyber"] as const,
	glow: ["off", "teal", "purple", "magenta", "ember", "frost", "cyber"] as const,
	surface: ["glass", "solid", "matte"] as const,
	glassVariant: ["void", "deep", "smoke", "frost"] as const,
	size: ["sm", "md", "lg"] as const,
	radius: ["none", "xs", "sm", "md", "lg", "xl", "full"] as const,
	blur: ["off", "sm", "md", "lg", "xl", "2xl"] as const,
	depth: [0, 1, 2, 3, 4] as const,
	bevel: ["off", "subtle", "soft", "medium"] as const,
	tone: ["cold", "neutral", "warm"] as const,
	imprint: ["subtle", "medium", "strong"] as const,
	shellDepth: ["shallow", "standard", "deep"] as const,
	space: ["1", "2", "3", "4", "5", "6", "8"] as const,
	textSize: ["xs", "sm", "base", "lg", "xl", "2xl"] as const,
	padding: ["sm", "md", "lg"] as const,
	duration: ["snap", "fast", "normal", "smooth", "glacial", "moderate"] as const,
	ease: ["linear", "in", "out", "inOut", "spring", "bounce"] as const,
} as const;

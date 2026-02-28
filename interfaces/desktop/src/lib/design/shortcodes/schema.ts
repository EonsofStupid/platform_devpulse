/**
 * @file Shortcode Validation Schema
 * @layer shortcodes
 * @package @devpulse/coldlight
 *
 * Zod schemas for validating class composition output.
 * Use at BUILD TIME to validate recipe output — reject raw Tailwind
 * in recipe class strings. Zero runtime cost in app code.
 *
 * Reference: CLASS_COMPOSITION.md
 */

import { z } from "zod";

// =============================================================================
// Shortcode Value Enums
// =============================================================================

/** Valid recipe variant shortcodes (v-*). */
export const RecipeVariants = [
	"void", "deep", "smoke", "frost",
	"cyber", "glacial", "molten", "chrome",
] as const;
export const RecipeVariantSchema = z.enum(RecipeVariants);
export type RecipeVariant = z.infer<typeof RecipeVariantSchema>;

/** Valid surface/material shortcodes (s-*). */
export const SurfaceMaterials = ["glass", "solid", "metal"] as const;
export const SurfaceMaterialSchema = z.enum(SurfaceMaterials);
export type SurfaceMaterial = z.infer<typeof SurfaceMaterialSchema>;

/** Valid elevation shortcodes (e-*). */
export const Elevations = ["0", "1", "2", "3", "4"] as const;
export const ElevationSchema = z.enum(Elevations);
export type Elevation = z.infer<typeof ElevationSchema>;

/** Valid size shortcodes (sz-*). */
export const ShortcodeSizes = ["xs", "sm", "md", "lg", "xl"] as const;
export const ShortcodeSizeSchema = z.enum(ShortcodeSizes);
export type ShortcodeSize = z.infer<typeof ShortcodeSizeSchema>;

/** Valid semantic intents. */
export const Intents = [
	"neutral", "primary", "secondary",
	"danger", "success", "warning",
] as const;
export const IntentSchema = z.enum(Intents);
export type Intent = z.infer<typeof IntentSchema>;

// =============================================================================
// Class Composition Schema
// =============================================================================

/**
 * Structured class composition — validates the pieces BEFORE
 * they get joined into a class string.
 */
export const ClassCompositionSchema = z.object({
	base: z.string().min(1),
	intent: IntentSchema.optional(),
	variant: RecipeVariantSchema.optional(),
	surface: SurfaceMaterialSchema.optional(),
	elevation: ElevationSchema.optional(),
	size: ShortcodeSizeSchema.optional(),
});

export type ClassComposition = z.infer<typeof ClassCompositionSchema>;

// =============================================================================
// Shortcode Class Patterns
// =============================================================================

/** Pattern matching for individual shortcode class tokens. */
const SHORTCODE_PATTERNS = [
	/^v-(void|deep|smoke|frost|cyber|glacial|molten|chrome)$/,
	/^s-(glass|solid|metal)$/,
	/^e-[0-4]$/,
	/^sz-(xs|sm|md|lg|xl)$/,
	/^rounded-(none|sm|md|lg|xl|full)$/,
] as const;

/** Known structural component class prefixes. */
const STRUCTURAL_PREFIXES = [
	"dialog-", "btn-", "panel-", "card-", "alert-", "badge-",
	"input-", "select-", "menu-", "tab-", "toast-", "tooltip-",
	"popover-", "combobox-", "toggle-", "switch-", "slider-",
	"progress-", "avatar-", "breadcrumb-", "pagination-",
	"accordion-", "callout-", "banner-", "separator-",
] as const;

/** Known base component classes. */
const BASE_CLASSES = [
	"dialog-overlay", "dialog-content", "dialog-header", "dialog-footer",
	"dialog-title", "dialog-description", "dialog-close",
] as const;

/**
 * Validate that a class string contains ONLY shortcode classes,
 * structural component classes, or empty strings.
 * Rejects raw Tailwind utilities (e.g., "flex", "p-4", "text-sm").
 *
 * @param classString - The class string from recipe output
 * @returns true if valid, false if contains raw Tailwind
 */
export function isValidShortcodeOutput(classString: string): boolean {
	if (classString === "") return true;

	const tokens = classString.split(/\s+/).filter(Boolean);

	return tokens.every((token) => {
		// Shortcode pattern match
		if (SHORTCODE_PATTERNS.some((p) => p.test(token))) return true;

		// Structural base class (exact match)
		if ((BASE_CLASSES as readonly string[]).includes(token)) return true;

		// Structural prefix match (component-specific classes)
		if (STRUCTURAL_PREFIXES.some((p) => token.startsWith(p))) return true;

		// Internal shortcode classes
		if (token.startsWith("motion-") || token.startsWith("blend-") ||
			token.startsWith("focus-") || token.startsWith("state-")) return true;

		return false;
	});
}

/**
 * Validate all slot class strings in a recipe output.
 * Returns an array of violations (slot name + offending class).
 */
export function validateRecipeOutput(
	slotClasses: Record<string, string>,
): { slot: string; violation: string }[] {
	const violations: { slot: string; violation: string }[] = [];

	for (const [slot, classString] of Object.entries(slotClasses)) {
		if (classString === "") continue;

		const tokens = classString.split(/\s+/).filter(Boolean);
		for (const token of tokens) {
			if (!isValidShortcodeOutput(token)) {
				violations.push({ slot, violation: token });
			}
		}
	}

	return violations;
}

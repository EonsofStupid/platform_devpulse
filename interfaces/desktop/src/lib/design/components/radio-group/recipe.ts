/**
 * @file RadioGroup Recipe — Shortcode Composition
 * @kind radio-group
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (radio-group-*) handle layout/sizing.
 * Radio-group-item handles checked state styling via data-state attr.
 */

export function radioGroupRecipe() {
	return {
		root: "radio-group-root",
		item: "radio-group-item",
		label: "radio-group-label",
	};
}

/**
 * @file RadioGroup Composition — Shortcode Composition
 * @kind radio-group
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in composition output.
 *
 * Structural classes (radio-group-*) handle layout/sizing.
 * Radio-group-item handles checked state styling via data-state attr.
 */

export function radioGroupComposition() {
	return {
		root: "radio-group-root",
		item: "radio-group-item",
		label: "radio-group-label",
	};
}

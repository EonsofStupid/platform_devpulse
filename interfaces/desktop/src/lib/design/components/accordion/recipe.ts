/**
 * @file Accordion Recipe — Shortcode Class Composition
 * @kind disclosure
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (accordion-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

export function accordionRecipe() {
	return {
		root: "accordion-root",
		item: "accordion-item",
		heading: "",
		trigger: "accordion-trigger sz-md",
		content: "accordion-content sz-md",
	};
}

/**
 * @file Accordion Recipe — Structural Classes Only
 * @kind disclosure
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

export function accordionRecipe() {
	return {
		root: "accordion-root",
		item: "accordion-item",
		heading: "",
		trigger: "accordion-trigger h-10 px-4 text-sm",
		content: "accordion-content p-4 text-sm",
	};
}

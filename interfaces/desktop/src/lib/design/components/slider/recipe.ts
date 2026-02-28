/**
 * @file Slider Recipe — Shortcode Composition
 * @kind slider
 * @layer components
 *
 * GOLD STANDARD — structural classes only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (slider-*) handle all layout/positioning.
 * Accent color consumed via --recipe-accent CSS variable.
 */

export function sliderRecipe() {
	return {
		root: "slider-root",
		track: "slider-track",
		range: "slider-range",
		thumb: "slider-thumb",
	};
}

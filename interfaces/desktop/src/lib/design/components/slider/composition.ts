/**
 * @file Slider Composition — Shortcode Composition
 * @kind slider
 * @layer components
 *
 * GOLD STANDARD — structural classes only.
 * NO raw Tailwind utilities in composition output.
 *
 * Structural classes (slider-*) handle all layout/positioning.
 * Accent color consumed via --composition-accent CSS variable.
 */

export function sliderComposition() {
	return {
		root: "slider-root",
		track: "slider-track",
		range: "slider-range",
		thumb: "slider-thumb",
	};
}

/**
 * @file Slider Recipe
 * @kind slider
 * @layer components
 *
 * SD5-driven styling for the slider compound component.
 * Returns per-slot class strings.
 */

const rootBase = "relative flex w-full touch-none select-none items-center";

const trackBase = [
	"relative h-2 w-full grow overflow-hidden rounded-full",
	"bg-white/10",
].join(" ");

const rangeBase = "absolute h-full bg-teal-500 rounded-full";

const thumbBase = [
	"block h-5 w-5 rounded-full",
	"border-2 border-teal-500 bg-surface-glass-void",
	"ring-offset-background transition-colors",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
	"disabled:pointer-events-none disabled:opacity-50",
].join(" ");

export function sliderRecipe(): {
	root: string;
	track: string;
	range: string;
	thumb: string;
} {
	return {
		root: rootBase,
		track: trackBase,
		range: rangeBase,
		thumb: thumbBase,
	};
}

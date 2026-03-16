/**
 * @file Entry Animation Recipes — play-once mount animations
 * @layer recipes/animations
 *
 * Entry animations play once on mount (forwards fill).
 * Used for page transitions, dialog/popover entrance, toast appearance.
 */

import { registerRecipe } from "../index.js";

registerRecipe({
	id: "animation.entry.fade-in",
	kind: "animation",
	label: "Fade In",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "fade-in",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[fade-in_300ms_ease-out_forwards]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.entry.slide-up",
	kind: "animation",
	label: "Slide Up",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "slide-up",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[slide-up_300ms_ease-out_forwards]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.entry.slide-down",
	kind: "animation",
	label: "Slide Down",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "slide-down",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[slide-down_300ms_ease-out_forwards]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.entry.scale-in",
	kind: "animation",
	label: "Scale In",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "scale-in",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[scale-in_250ms_ease-out_forwards]",
			visual: "none",
		},
	},
});

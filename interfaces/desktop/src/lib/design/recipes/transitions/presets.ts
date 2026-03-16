/**
 * @file Transition Preset Recipes
 * @layer recipes/transitions
 *
 * Each transition preset is a recipe with its transition axis set.
 * Maps 1:1 to the transition tokens in motion.json.
 * VPB uses these to populate transition pickers per component.
 */

import { registerRecipe } from "../index.js";

registerRecipe({
	id: "transition.speed.snap",
	kind: "transition",
	label: "Snap (50ms)",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "snap",
		radius: "none",
		size: "md",
	},
	slots: {
		root: { structural: "", visual: "none" },
	},
});

registerRecipe({
	id: "transition.speed.fast",
	kind: "transition",
	label: "Fast (150ms)",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "fast",
		radius: "none",
		size: "md",
	},
	slots: {
		root: { structural: "", visual: "none" },
	},
});

registerRecipe({
	id: "transition.speed.normal",
	kind: "transition",
	label: "Normal (250ms)",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "normal",
		radius: "none",
		size: "md",
	},
	slots: {
		root: { structural: "", visual: "none" },
	},
});

registerRecipe({
	id: "transition.speed.smooth",
	kind: "transition",
	label: "Smooth (400ms)",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "smooth",
		radius: "none",
		size: "md",
	},
	slots: {
		root: { structural: "", visual: "none" },
	},
});

registerRecipe({
	id: "transition.easing.spring",
	kind: "transition",
	label: "Spring",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "spring",
		radius: "none",
		size: "md",
	},
	slots: {
		root: { structural: "", visual: "none" },
	},
});

registerRecipe({
	id: "transition.easing.bounce",
	kind: "transition",
	label: "Bounce",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "bounce",
		radius: "none",
		size: "md",
	},
	slots: {
		root: { structural: "", visual: "none" },
	},
});

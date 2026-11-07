/**
 * @file Ambient Animation Recipes — infinite loop animations
 * @layer recipes/animations
 *
 * Ambient animations play continuously. Each variant maps to a @keyframe
 * defined in generated/keyframes.css and a motion token in motion.json.
 *
 * These are registered as recipes so the style catalog can enumerate them,
 * VPB can offer them in animation pickers, and components can reference
 * them by ID through the motion axis.
 */

import { registerRecipe } from "../index.js";

registerRecipe({
	id: "animation.ambient.breathe",
	kind: "animation",
	label: "Breathing Pulse",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "breathe",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[cl-breathe_4s_ease-in-out_infinite]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.ambient.shimmer",
	kind: "animation",
	label: "Liquid Shimmer",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "shimmer",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[cl-shimmer_8s_linear_infinite]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.ambient.drift",
	kind: "animation",
	label: "Particle Drift",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "drift",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[cl-drift_8s_ease-in-out_infinite]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.ambient.pulse",
	kind: "animation",
	label: "Glow Pulse",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "pulse",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[cl-pulse_3s_ease-in-out_infinite]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.ambient.pulse-glow",
	kind: "animation",
	label: "Pulse Glow",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "breathe",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[pulse-glow_4s_ease-in-out_infinite]",
			visual: "none",
		},
	},
});

registerRecipe({
	id: "animation.ambient.spin",
	kind: "animation",
	label: "Spin",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "none",
		size: "md",
	},
	slots: {
		root: {
			structural: "animate-[spin_1s_linear_infinite]",
			visual: "none",
		},
	},
});

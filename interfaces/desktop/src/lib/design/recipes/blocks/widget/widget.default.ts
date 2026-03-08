/**
 * @file Widget Recipe — Glass Void
 * @id widget.glass.void
 * @kind widget
 * @layer recipes
 *
 * Pure data declaration. Zero functions.
 * Slots declare structural classes + visual mode.
 * The engine (resolveRecipe) handles v-* encoding from the 8-axis registry.
 *
 * root: visual "all" — receives v-s2 v-d2 v-b2 v-g1 v-f5 etc from props
 * all other slots: visual "none" — structural only, inherit from root
 */

import { registerRecipe } from "../../index.js";

registerRecipe({
	id: "widget.glass.void",
	kind: "widget",
	label: "Glass Void Widget",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	slots: {
		root: {
			structural: "flex flex-col overflow-hidden",
			visual: "all",
		},
		header: {
			structural: "flex items-center justify-between px-4 py-3 border-b border-border-subtle",
			visual: "none",
		},
		title: {
			structural: "text-sm font-semibold font-display text-text-link tracking-wide",
			visual: "none",
		},
		actions: {
			structural: "flex items-center gap-2",
			visual: "none",
		},
		tabs: {
			structural: "flex items-center gap-1 px-4 border-b border-border-subtle",
			visual: "none",
		},
		tab: {
			structural: "px-3 py-2 text-xs font-medium text-text-muted hover:text-text-link transition-colors",
			visual: "none",
		},
		content: {
			structural: "flex-1 p-4",
			visual: "none",
		},
		footer: {
			structural: "px-4 py-3 border-t border-border-subtle",
			visual: "none",
		},
	},
});

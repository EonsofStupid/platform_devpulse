import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "dialog.default",
	kind: "dialog",
	label: "Default Dialog",
	defaultRecipe: "dialog.glass.void",
	defaultProps: {
		surface: "glass-void",
		material: "none",
		depth: "z3",
		bevel: "soft",
		glow: "teal",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
	},
	slots: {
		trigger: { required: false },
		portal: { required: true },
		overlay: { required: true },
		content: { required: true },
		title: { required: false },
		description: { required: false },
		close: { required: false },
		header: { required: false },
		footer: { required: false },
	},
});

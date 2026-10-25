import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "panel.default",
	kind: "panel",
	label: "Default Panel",
	defaultRecipe: "panel.glass.void",
	defaultProps: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
	},
	slots: {
		header: { required: false },
		body: { required: true },
		footer: { required: false },
	},
});

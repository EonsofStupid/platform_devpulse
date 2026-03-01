import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "tabs.default",
	kind: "tabs",
	label: "Default Tabs",
	defaultRecipe: "tabs.glass.void",
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
		root: { required: true },
		list: { required: true },
		trigger: { required: true },
		content: { required: true },
	},
});

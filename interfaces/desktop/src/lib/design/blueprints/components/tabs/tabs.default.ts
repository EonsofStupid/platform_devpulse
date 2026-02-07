import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "tabs.default",
	kind: "tabs",
	label: "Default Tabs",
	defaultRecipe: "tabs.glass.void",
	defaultProps: {
		accent: "teal",
		surface: "glass",
		variant: "void",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "off",
	},
	slots: {
		root: { required: true },
		list: { required: true },
		trigger: { required: true },
		content: { required: true },
	},
});

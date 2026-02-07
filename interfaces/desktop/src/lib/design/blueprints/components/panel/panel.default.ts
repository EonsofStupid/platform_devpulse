import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "panel.default",
	kind: "panel",
	label: "Default Panel",
	defaultRecipe: "panel.glass.void",
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
		header: { required: false },
		body: { required: true },
		footer: { required: false },
	},
});

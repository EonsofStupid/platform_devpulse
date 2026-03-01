import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "combobox.default",
	kind: "combobox",
	label: "Default Combobox",
	defaultRecipe: "combobox.glass.void",
	defaultProps: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "teal",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
	},
	slots: {
		input: { required: true },
		trigger: { required: false },
		content: { required: true },
		item: { required: false },
		group: { required: false },
		empty: { required: false },
		label: { required: false },
	},
});

import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "tabs.default",
	kind: "tabs",
	label: "Default Tabs",
	defaultRecipe: "tabs.glass.void",
	defaultProps: {
		s: 1,
		z: 0,
		d: 2,
		b: 0,
		g: 0,
		f: 0,
		m: 0,
		t: 0,
		radius: "lg",
	},
	slots: {
		root: { required: true },
		list: { required: true },
		trigger: { required: true },
		content: { required: true },
	},
});

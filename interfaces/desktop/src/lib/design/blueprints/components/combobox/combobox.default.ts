import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "combobox.default",
	kind: "combobox",
	label: "Default Combobox",
	defaultRecipe: "combobox.glass.void",
	defaultProps: {
		s: 1,
		z: 0,
		d: 2,
		b: 2,
		g: 1,
		f: 0,
		m: 0,
		t: 0,
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

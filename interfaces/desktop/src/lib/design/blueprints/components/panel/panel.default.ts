import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "panel.default",
	kind: "panel",
	label: "Default Panel",
	defaultRecipe: "panel.glass.void",
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
		header: { required: false },
		body: { required: true },
		footer: { required: false },
	},
});

import { registerBlueprint } from "../../index.js";

registerBlueprint({
	id: "dialog.default",
	kind: "dialog",
	label: "Default Dialog",
	defaultRecipe: "dialog.glass.void",
	defaultProps: {
		s: 1,
		z: 0,
		d: 3,
		b: 2,
		g: 1,
		f: 0,
		m: 0,
		t: 0,
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

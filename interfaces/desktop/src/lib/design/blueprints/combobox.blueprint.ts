/**
 * @file Combobox Blueprint
 * @description Composition defaults for the Combobox component.
 */

import { registerBlueprint } from "./index.js";

registerBlueprint({
	id: "combobox.default",
	kind: "combobox",
	label: "Default Combobox",
	defaultRecipe: "combobox.glass.void",
	defaultProps: {
		accent: "teal",
		surface: "glass",
		variant: "void",
		radius: "lg",
		depth: 2,
		glow: "teal",
		bevel: "soft",
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

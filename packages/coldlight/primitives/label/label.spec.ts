import { definePrimitive } from "../../schema/index.js";

export const labelSpec = definePrimitive({
	kind: "label",
	label: "Label",
	description: "An accessible label that associates with a form control via the for attribute.",
	category: "form",
	behaviorHook: "useLabel",
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "The native label element",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

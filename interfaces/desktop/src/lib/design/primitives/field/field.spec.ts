import { definePrimitive } from "../../schema/index.js";

export const fieldSpec = definePrimitive({
	kind: "field",
	label: "Field",
	description:
		"A compound form field that links label, control, description, and error slots via ARIA.",
	category: "form",
	behaviorHook: "useField",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "group",
				ariaAttrs: ["aria-labelledby"],
				description: "Grouping container for the form field",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label linked to the control via for attribute",
			},
			control: {
				element: "div",
				role: null,
				ariaAttrs: ["aria-describedby", "aria-invalid", "aria-required", "aria-disabled"],
				description: "Generic slot for the form control element",
			},
			description: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Help text linked to the control via aria-describedby",
			},
			error: {
				element: "span",
				role: "alert",
				ariaAttrs: ["aria-live"],
				description: "Validation error message announced to screen readers",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

import { definePrimitive } from "../../schema/index.js";

export const textFieldSpec = definePrimitive({
	kind: "text-field",
	label: "Text Field",
	description: "A text input with label, description, and error linkage via ARIA.",
	category: "form",
	behaviorHook: "useTextField",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				description: "Structural wrapper for the text field",
			},
			input: {
				element: "input",
				role: null,
				ariaAttrs: [
					"aria-labelledby",
					"aria-describedby",
					"aria-errormessage",
					"aria-invalid",
					"aria-required",
					"aria-disabled",
					"aria-readonly",
					"aria-label",
				],
				description: "Native text input element",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label linked to the input via for attribute",
			},
			description: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Help text linked to the input via aria-describedby",
			},
			error: {
				element: "span",
				role: "alert",
				ariaAttrs: ["aria-live"],
				description: "Validation error message announced to screen readers",
			},
		},
		keyboard: [],
		focusStrategy: "direct",
	},
});

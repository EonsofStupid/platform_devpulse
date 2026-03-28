import { definePrimitive } from "../../schema/index.js";

export const checkboxSpec = definePrimitive({
	kind: "checkbox",
	label: "Checkbox",
	description: "A control that toggles between checked and unchecked states.",
	category: "interactive",
	behaviorHook: "useCheckbox",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "button",
				role: "checkbox",
				ariaAttrs: [
					"aria-checked",
					"aria-disabled",
					"aria-required",
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
				],
				description: "The toggle control element",
			},
			indicator: {
				element: "span",
				role: null,
				decorative: true,
				container: true,
				ariaAttrs: [],
				description: "Visual check/indeterminate mark indicator",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label for the checkbox",
			},
		},
		keyboard: [{ key: "Space", action: "Toggle checked state" }],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",
	},
});

import { definePrimitive } from "../../schema/index.js";

export const radioGroupSpec = definePrimitive({
	kind: "radio-group",
	label: "Radio Group",
	description:
		"A group of mutually exclusive radio options where only one can be selected at a time.",
	category: "form",
	behaviorHook: "useRadioGroup",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "radiogroup",
				ariaAttrs: [
					"aria-orientation",
					"aria-label",
					"aria-labelledby",
					"aria-required",
					"aria-disabled",
				],
				description: "Container declaring the radio group role",
			},
			radio: {
				element: "div",
				role: "radio",
				ariaAttrs: ["aria-checked", "aria-disabled", "aria-labelledby", "aria-describedby"],
				description: "Individual radio option that can be checked",
			},
			label: {
				element: "label",
				role: null,
				ariaAttrs: [],
				description: "Accessible label for an individual radio option",
			},
			description: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "Supplementary description for an individual radio option",
			},
		},
		keyboard: [
			{
				key: "ArrowDown",
				action: "Move to next radio and select",
				condition: "vertical orientation",
			},
			{
				key: "ArrowRight",
				action: "Move to next radio and select",
				condition: "horizontal orientation",
			},
			{
				key: "ArrowUp",
				action: "Move to previous radio and select",
				condition: "vertical orientation",
			},
			{
				key: "ArrowLeft",
				action: "Move to previous radio and select",
				condition: "horizontal orientation",
			},
			{ key: "Space", action: "Select the focused radio option" },
		],
		focusStrategy: "roving",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/radio/",
	},
});

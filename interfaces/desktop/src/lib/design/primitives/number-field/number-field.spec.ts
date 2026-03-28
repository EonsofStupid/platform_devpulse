import { definePrimitive } from "../../schema/index.js";

export const numberFieldSpec = definePrimitive({
	kind: "number-field",
	label: "Number Field",
	description:
		"A numeric spinbutton with increment and decrement controls, min/max clamping, and step support.",
	category: "form",
	behaviorHook: "useNumberField",
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: "group",
				ariaAttrs: ["aria-label"],
				description: "Grouping container for the number field",
			},
			input: {
				element: "input",
				role: "spinbutton",
				ariaAttrs: [
					"aria-valuenow",
					"aria-valuemin",
					"aria-valuemax",
					"aria-valuetext",
					"aria-disabled",
					"aria-readonly",
					"aria-required",
					"aria-describedby",
				],
				description: "Numeric input with spinbutton semantics",
			},
			increment: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label", "aria-disabled"],
				description: "Button to increase the numeric value by one step",
			},
			decrement: {
				element: "button",
				role: null,
				ariaAttrs: ["aria-label", "aria-disabled"],
				description: "Button to decrease the numeric value by one step",
			},
		},
		keyboard: [
			{ key: "ArrowUp", action: "Increment value by one step" },
			{ key: "ArrowDown", action: "Decrement value by one step" },
			{ key: "Home", action: "Set value to minimum", condition: "min is defined" },
			{ key: "End", action: "Set value to maximum", condition: "max is defined" },
		],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/",
	},
});

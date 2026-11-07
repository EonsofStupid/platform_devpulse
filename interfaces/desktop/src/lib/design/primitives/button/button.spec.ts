import { definePrimitive } from "../../schema/index.js";

export const buttonSpec = definePrimitive({
	kind: "button",
	label: "Button",
	description: "An interactive element that triggers an action when pressed.",
	category: "interactive",
	behaviorHook: "useButton",
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "button",
				role: "button",
				ariaAttrs: ["aria-disabled", "aria-pressed", "aria-expanded"],
				description: "The button element",
			},
		},
		keyboard: [
			{ key: "Space", action: "Activate the button" },
			{ key: "Enter", action: "Activate the button" },
		],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
	},
});

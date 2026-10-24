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
			// Slots follow the behavior's anatomy (`behaviors/inputs/button/button.anatomy.ts`).
			root: {
				element: "button",
				role: "button",
				ariaAttrs: ["aria-disabled", "aria-pressed", "aria-expanded", "aria-busy", "aria-label"],
				description: "The button element",
			},
			icon: {
				element: "span",
				role: null,
				ariaAttrs: ["aria-hidden"],
				description: "Decorative leading or trailing icon, hidden from assistive technology",
			},
			label: {
				element: "span",
				role: null,
				ariaAttrs: [],
				description: "The visible action text; without it the root needs aria-label",
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

import { definePrimitive } from "../../schema/index.js";

export const toggleSpec = definePrimitive({
	kind: "toggle",
	label: "Toggle",
	description: "A button that toggles between pressed and unpressed states.",
	category: "interactive",
	behaviorHook: "useToggle",
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "button",
				role: "button",
				ariaAttrs: ["aria-pressed", "aria-disabled", "aria-label"],
				description: "The toggle button element",
			},
		},
		keyboard: [{ key: "Space", action: "Toggle pressed state" }],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
	},
});

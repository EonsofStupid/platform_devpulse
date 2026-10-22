import { definePrimitive } from "../../schema/index.js";

export const linkSpec = definePrimitive({
	kind: "link",
	label: "Link",
	description: "A navigational element that activates on click or Enter key.",
	category: "interactive",
	behaviorHook: "useLink",
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "a",
				role: null,
				ariaAttrs: ["aria-disabled", "aria-label", "aria-current"],
				description: "The anchor element for navigation",
			},
		},
		keyboard: [{ key: "Enter", action: "Activate the link" }],
		focusStrategy: "direct",
		apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/link/",
	},
});

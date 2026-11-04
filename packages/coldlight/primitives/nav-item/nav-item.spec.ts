import { definePrimitive } from "../../schema/index.js";

export const navItemSpec = definePrimitive({
	kind: "nav-item",
	label: "Nav Item",
	description: "One link in a navigation list, marked when it is the current page.",
	category: "navigation",
	behaviorHook: "useNavItem",
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "a",
				role: null,
				ariaAttrs: ["aria-current", "aria-disabled"],
				description: "The link",
			},
		},
		keyboard: [{ key: "Enter", action: "Follow the link" }],
		focusStrategy: "none",
	},
});

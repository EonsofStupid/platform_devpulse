import { definePrimitive } from "../../schema/index.js";

export const rowSpec = definePrimitive({
	kind: "row",
	label: "Row",
	description: "A horizontal flex container that lays out children along the inline axis.",
	category: "layout",
	behaviorHook: null,
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "Horizontal flex container",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

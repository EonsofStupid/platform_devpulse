import { definePrimitive } from "../../schema/index.js";

export const stackSpec = definePrimitive({
	kind: "stack",
	label: "Stack",
	description: "A vertical flex container that stacks children along the block axis.",
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
				description: "Vertical flex container",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

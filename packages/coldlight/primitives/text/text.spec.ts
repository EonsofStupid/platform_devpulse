import { definePrimitive } from "../../schema/index.js";

export const textSpec = definePrimitive({
	kind: "text",
	label: "Text",
	description:
		"A polymorphic text element that renders as span, p, strong, em, small, or div via the as prop.",
	category: "display",
	behaviorHook: null,
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "svelte:element",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "Dynamic text element determined by the as prop",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

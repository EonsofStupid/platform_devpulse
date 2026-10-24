import { definePrimitive } from "../../schema/index.js";

export const surfaceSpec = definePrimitive({
	kind: "surface",
	label: "Surface",
	description:
		"A polymorphic container that renders as div, section, article, aside, main, footer, header, or nav via the as prop.",
	category: "layout",
	behaviorHook: null,
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "svelte:element",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "Dynamic container element determined by the as prop",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

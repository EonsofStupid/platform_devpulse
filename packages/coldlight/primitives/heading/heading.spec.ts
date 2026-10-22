import { definePrimitive } from "../../schema/index.js";

export const headingSpec = definePrimitive({
	kind: "heading",
	label: "Heading",
	description:
		"A level-based heading that renders as h1 through h6 via svelte:element, with a data-level attribute.",
	category: "display",
	behaviorHook: null,
	compound: false,
	a11y: {
		slots: {
			root: {
				element: "svelte:element",
				role: null,
				ariaAttrs: ["aria-level"],
				container: true,
				description:
					"Dynamic heading element (h1-h6) determined by the level prop, exposes data-level",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

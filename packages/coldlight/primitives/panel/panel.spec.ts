import { definePrimitive } from "../../schema/index.js";

export const panelSpec = definePrimitive({
	kind: "panel",
	label: "Panel",
	description: "A glass container with header, body and footer.",
	category: "layout",
	behaviorHook: null,
	compound: true,
	a11y: {
		slots: {
			root: {
				element: "div",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "The panel's surface",
			},
			header: {
				element: "div",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "Title row",
			},
			body: {
				element: "div",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "The scrolling content",
			},
			footer: {
				element: "div",
				role: null,
				ariaAttrs: [],
				container: true,
				description: "Action row",
			},
		},
		keyboard: [],
		focusStrategy: "none",
	},
});

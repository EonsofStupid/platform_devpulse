import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Scroll area anatomy — custom scrollbar container.
 */
export const scrollAreaAnatomy = createAnatomy("scroll-area", {
	root: {
		description: "Outer container that establishes the scroll area dimensions.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	viewport: {
		description: "Scrollable viewport that clips overflowing content. overflow: auto/scroll.",
		element: "div",
		required: true,
		accepts: ["any"],
		keyboard: {
			navigates: [
				"ArrowUp",
				"ArrowDown",
				"ArrowLeft",
				"ArrowRight",
				"PageUp",
				"PageDown",
				"Home",
				"End",
			],
			focusable: true,
		},
	},
	scrollbar: {
		description: "Custom scrollbar track. Positioned along the edge of the viewport.",
		element: "div",
		required: false,
		accepts: ["structural"],
		stateAttrs: ["data-orientation", "data-state"],
		repeatable: true,
	},
	thumb: {
		description: "Draggable scrollbar thumb indicating scroll position and content ratio.",
		element: "div",
		required: false,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
});

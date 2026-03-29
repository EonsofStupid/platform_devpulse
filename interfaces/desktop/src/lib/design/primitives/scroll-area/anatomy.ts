import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Scroll area anatomy — custom scrollbar container.
 *
 * A scroll area wraps content that may overflow, providing custom-styled
 * scrollbars. The viewport clips content and enables scrolling. Scrollbars
 * (vertical and horizontal) overlay or sit beside the viewport.
 *
 * Keyboard:
 * - ArrowUp/ArrowDown: scroll vertically
 * - ArrowLeft/ArrowRight: scroll horizontally
 * - PageUp/PageDown: scroll by page
 * - Home/End: scroll to top/bottom
 */
export const scrollAreaAnatomy = createAnatomy("scroll-area", {
	root: {
		description:
			"Outer container that establishes the scroll area dimensions. Contains the viewport and scrollbar elements.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	viewport: {
		description:
			"Scrollable viewport that clips overflowing content. The actual scrolling happens on this element. overflow: auto/scroll.",
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
		description:
			"Custom scrollbar track. Positioned along the edge of the viewport. Contains the thumb. Can be vertical or horizontal.",
		element: "div",
		required: false,
		accepts: ["structural"],
		stateAttrs: ["data-orientation", "data-state"],
		repeatable: true,
	},
	thumb: {
		description:
			"Draggable scrollbar thumb indicating scroll position and content ratio. Size proportional to visible content vs total content.",
		element: "div",
		required: false,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
});

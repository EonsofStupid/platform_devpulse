import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * NavItem anatomy — one link in a navigation list.
 *
 * The current page carries aria-current="page"; a disabled item has no href,
 * so it leaves the tab order.
 */
export const navItemAnatomy = createAnatomy("nav-item", {
	root: {
		description: "The link. aria-current='page' on the current page; aria-disabled when disabled.",
		element: "a",
		required: true,
		aria: {
			conditional: ["aria-current", "aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state", "data-selected", "data-disabled"],
		keyboard: {
			activates: ["Enter"],
			focusable: true,
		},
	},
});

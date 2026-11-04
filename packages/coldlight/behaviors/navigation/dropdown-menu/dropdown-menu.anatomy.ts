import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * DropdownMenu anatomy — a menu with a disclosure trigger, its behavior useMenu's.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * Keyboard:
 * - Enter/Space: activate item
 * - ArrowDown/ArrowUp: navigate items
 * - Home/End: first/last item
 * - Escape: close, focus returns to the trigger
 */
export const dropdownMenuAnatomy = createAnatomy("dropdown-menu", {
	root: {
		description: "Structural wrapper holding the trigger and anchoring the content.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	trigger: {
		description:
			"Button that opens and closes the menu. Uses aria-haspopup='menu', aria-expanded and aria-controls.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-haspopup"],
			conditional: ["aria-expanded", "aria-controls"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state"],
		keyboard: {
			activates: ["Space", "Enter"],
			navigates: ["ArrowDown", "ArrowUp"],
			focusable: true,
		},
	},
	content: {
		description: "The menu itself, visible when open. Uses role='menu', named by its trigger.",
		element: "div",
		required: true,
		aria: {
			role: "menu",
			conditional: ["aria-labelledby", "aria-label", "aria-orientation"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-state"],
	},
	item: {
		description: "One action. Uses role='menuitem'; a disabled item is skipped by the arrow keys.",
		element: "div",
		required: true,
		aria: {
			role: "menuitem",
			conditional: ["aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
	separator: {
		description: "Visual divider between groups of items. Uses role='separator'. Not focusable.",
		element: "div",
		required: false,
		aria: {
			role: "separator",
		},
		accepts: ["none"],
	},
	group: {
		description: "Related items, role='group'.",
		element: "div",
		required: false,
		aria: {
			role: "group",
			conditional: ["aria-label"],
		},
		accepts: ["structural"],
		repeatable: true,
	},
	"group-label": {
		description: "Heading for a group of items. Not focusable.",
		element: "div",
		required: false,
		accepts: ["text"],
		repeatable: true,
	},
});

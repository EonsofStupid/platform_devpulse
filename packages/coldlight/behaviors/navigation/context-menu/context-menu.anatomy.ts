import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * ContextMenu anatomy — a menu opened by right-click at the pointer.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * The trigger is a plain zone that takes the contextmenu event, which the
 * keyboard's context-menu key and Shift+F10 also raise.
 */
export const contextMenuAnatomy = createAnatomy("context-menu", {
	trigger: {
		description:
			"Zone that opens the menu on the contextmenu event. No ARIA role: a plain container.",
		element: "div",
		required: true,
		accepts: ["any"],
		stateAttrs: ["data-state"],
	},
	content: {
		description: "The menu, placed at the pointer. Uses role='menu'.",
		element: "div",
		required: true,
		aria: {
			role: "menu",
			conditional: ["aria-label", "aria-orientation"],
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

import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Menu anatomy — popup list of actions triggered from a button.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 *
 * A menu presents a list of actions (not selection — use Listbox for that).
 * Items execute commands when activated. Supports sub-menus, separators,
 * and grouped items with labels.
 *
 * Critical distinction from Listbox: menu items are ACTIONS (delete, rename, share).
 * Listbox options are SELECTIONS (pick a value). Different ARIA roles entirely.
 *
 * Keyboard:
 * - ArrowDown/ArrowUp: move between items
 * - Enter/Space: activate item
 * - Escape: close menu, return focus to trigger
 * - ArrowRight: open sub-menu (if present)
 * - ArrowLeft: close sub-menu
 * - Home/End: first/last item
 * - Type-ahead: focus matching item
 */
export const menuAnatomy = createAnatomy("menu", {
	root: {
		description:
			"Structural wrapper grouping trigger and content. Not rendered as a specific ARIA widget — just provides context.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	trigger: {
		description:
			"Button that opens the menu. Uses aria-haspopup='menu' and aria-expanded. Focus returns here when menu closes.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-haspopup"],
			conditional: ["aria-expanded"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state"],
		keyboard: {
			activates: ["Space", "Enter"],
			navigates: ["ArrowDown"],
			focusable: true,
		},
	},
	content: {
		description:
			"Popup panel containing menu items. Uses role='menu'. Positioned by floating UI. Focus moves to first item on open.",
		element: "div",
		required: true,
		aria: {
			role: "menu",
			conditional: ["aria-label", "aria-labelledby"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-state"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "Home", "End"],
			dismisses: "Escape",
			focusable: true,
		},
	},
	item: {
		description:
			"Action item in the menu. Uses role='menuitem'. Activating an item executes its action and closes the menu.",
		element: "div",
		required: true,
		aria: {
			role: "menuitem",
			conditional: ["aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-highlighted", "data-disabled"],
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
		description:
			"Logical group of related items. Uses role='group' with aria-labelledby pointing to the group label.",
		element: "div",
		required: false,
		aria: {
			role: "group",
			conditional: ["aria-labelledby"],
		},
		accepts: ["structural"],
		repeatable: true,
	},
	label: {
		description:
			"Group heading identifying a section of related items. Not focusable. Referenced by the group's aria-labelledby.",
		element: "div",
		required: false,
		accepts: ["text"],
		repeatable: true,
	},
});

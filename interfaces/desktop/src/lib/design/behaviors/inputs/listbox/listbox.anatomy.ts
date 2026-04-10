import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Listbox anatomy — single-column selectable option list.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
 *
 * A listbox presents a list of options for selection. Options can be
 * grouped with labels. Supports single and multiple selection.
 *
 * Critical distinction from Combobox: listbox has NO text input.
 * Critical distinction from Menu: listbox is for selection, menu is for actions.
 *
 * Keyboard:
 * - ArrowDown/ArrowUp: move focus between options
 * - Home/End: first/last option
 * - Space: toggle selection (in multiple mode)
 * - Type-ahead: focus matching option by first character(s)
 */
export const listboxAnatomy = createAnatomy("listbox", {
	root: {
		description:
			"Scrollable list of selectable options. Uses role='listbox'. Manages focus via aria-activedescendant. Supports single and multiple selection modes.",
		element: "div",
		required: true,
		aria: {
			role: "listbox",
			conditional: [
				"aria-label",
				"aria-labelledby",
				"aria-multiselectable",
				"aria-activedescendant",
				"aria-orientation",
			],
		},
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "Home", "End"],
			focusable: true,
		},
	},
	option: {
		description:
			"Individual selectable item. Uses role='option' with aria-selected. Focused option is tracked via aria-activedescendant on root (NOT via direct focus on the option).",
		element: "div",
		required: true,
		aria: {
			role: "option",
			conditional: ["aria-selected", "aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-highlighted", "data-selected", "data-disabled"],
		repeatable: true,
	},
	group: {
		description:
			"Logical group of related options (e.g., 'Fruits', 'Vegetables'). Uses role='group' with aria-labelledby pointing to the group label.",
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
			"Group label identifying a section of related options. Referenced by the group's aria-labelledby. Not independently focusable.",
		element: "div",
		required: false,
		aria: {
			role: "presentation",
		},
		accepts: ["text"],
		repeatable: true,
	},
});

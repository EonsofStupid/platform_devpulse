import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Tree anatomy — hierarchical expandable list.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * A tree displays hierarchical data as an expandable/collapsible list.
 * Items can be expanded to reveal child items. Supports single and
 * multiple selection.
 *
 * Keyboard:
 * - ArrowDown/ArrowUp: move between visible items
 * - ArrowRight: expand collapsed item / move to first child
 * - ArrowLeft: collapse expanded item / move to parent
 * - Home/End: first/last visible item
 * - Space: toggle selection
 * - Enter: activate item
 * - Type-ahead: focus matching item
 */
export const treeAnatomy = createAnatomy("tree", {
	root: {
		description:
			"Tree container. Uses role='tree'. Manages expanded/collapsed state and keyboard navigation across the hierarchy.",
		element: "div",
		required: true,
		aria: {
			role: "tree",
			conditional: ["aria-label", "aria-labelledby", "aria-multiselectable"],
		},
		accepts: ["structural"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"],
			focusable: true,
		},
	},
	item: {
		description:
			"Individual tree item. Uses role='treeitem'. When expandable, has aria-expanded. Can be nested to create hierarchy. aria-level indicates depth.",
		element: "div",
		required: true,
		aria: {
			role: "treeitem",
			conditional: ["aria-expanded", "aria-selected", "aria-disabled", "aria-level"],
		},
		accepts: ["text", "media", "structural"],
		stateAttrs: ["data-expanded", "data-selected", "data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
	group: {
		description:
			"Container for child tree items within an expanded parent. Uses role='group'. Only visible when parent item is expanded.",
		element: "div",
		required: false,
		aria: {
			role: "group",
		},
		accepts: ["structural"],
		repeatable: true,
	},
});

import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Grid list anatomy — two-dimensional selectable item grid.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * A grid list presents items in a grid layout with keyboard navigation
 * in both axes. Used for image galleries, card grids, or any collection
 * where 2D navigation is natural. Supports single, multiple, and no selection.
 *
 * Keyboard:
 * - ArrowRight/ArrowLeft: move between items in a row
 * - ArrowDown/ArrowUp: move between rows
 * - Home/End: first/last item in row
 * - Ctrl+Home/Ctrl+End: first/last item overall
 * - Space: toggle selection on focused item
 * - Ctrl+A: select all (in multiple mode)
 */
export const gridListAnatomy = createAnatomy("grid-list", {
	root: {
		description:
			"Grid container for selectable items. Uses role='grid' with aria-label or aria-labelledby. Manages selection state and 2D keyboard navigation.",
		element: "div",
		required: true,
		aria: {
			role: "grid",
			conditional: ["aria-label", "aria-labelledby", "aria-multiselectable"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"],
			focusable: true,
		},
	},
	item: {
		description:
			"Individual selectable item in the grid. Uses role='gridcell' (or role='row' containing gridcell depending on layout). Tracks selected and focused state.",
		element: "div",
		required: true,
		aria: {
			role: "gridcell",
			conditional: ["aria-selected", "aria-disabled"],
		},
		accepts: ["any"],
		stateAttrs: ["data-selected", "data-focused", "data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
});

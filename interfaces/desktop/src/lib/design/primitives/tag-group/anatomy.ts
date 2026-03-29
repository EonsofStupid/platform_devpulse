import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Tag group anatomy — collection of removable/selectable tags.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 *
 * A tag group displays a collection of tags (chips/badges) that can be
 * selected or removed. Used for multi-select displays, filter chips,
 * label collections. Each tag can have a remove button for dismissal.
 *
 * Keyboard:
 * - ArrowRight/ArrowLeft: move between tags
 * - Delete/Backspace: remove focused tag
 * - Space/Enter: select tag or activate remove button
 */
export const tagGroupAnatomy = createAnatomy("tag-group", {
	root: {
		description:
			"Container for the tag collection. Uses role='grid' or role='listbox' depending on whether tags are selectable. Manages keyboard navigation between tags.",
		element: "div",
		required: true,
		aria: {
			role: "grid",
			conditional: ["aria-label", "aria-labelledby"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			navigates: ["ArrowLeft", "ArrowRight"],
			focusable: true,
		},
	},
	tag: {
		description:
			"Individual tag/chip. Uses role='gridcell' (or role='option' in listbox mode). Tracks selected state. Can contain text and an optional remove button.",
		element: "div",
		required: true,
		aria: {
			role: "gridcell",
			conditional: ["aria-selected", "aria-disabled"],
		},
		accepts: ["text", "media", "interactive"],
		stateAttrs: ["data-selected", "data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
	label: {
		description:
			"Visible label describing the tag group (e.g., 'Selected filters', 'Tags'). If omitted, root MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
	},
	description: {
		description:
			"Help text providing context about the tag group (e.g., 'Press Delete to remove tags').",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	remove: {
		description:
			"Remove/dismiss button within a tag. Must have aria-label (typically 'Remove {tag name}'). Fires the onRemove callback with the tag's key.",
		element: "button",
		required: false,
		aria: {
			role: "button",
			required: ["aria-label"],
		},
		accepts: ["media"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});

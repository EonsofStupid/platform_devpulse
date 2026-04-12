import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Pin input anatomy — segmented single-character fields for entering
 * verification codes, one-time passwords, or PINs.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/textbox/ (each cell)
 *           https://www.w3.org/WAI/ARIA/apg/practices/grouping-controls/ (group)
 *
 * Composition: one `group` wraps N `cell` elements. Each cell is a
 * single-character text input with shared keyboard handling — focus
 * advances on entry, reverses on backspace, paste auto-distributes
 * across cells, arrow keys navigate left/right.
 *
 * Keyboard per cell:
 * - Printable character: write, advance to next cell
 * - Backspace on empty cell: clear previous cell and focus it
 * - Backspace on filled cell: clear the cell
 * - Delete: clear the cell, keep focus
 * - ArrowLeft / ArrowRight: move focus one cell
 * - Home / End: jump to first / last cell
 * - Paste: auto-distribute across cells starting from the focused one
 */
export const pinInputAnatomy = createAnatomy("pin-input", {
	root: {
		description:
			"Container grouping every cell. Exposes role=group with an accessible label so assistive tech announces the set as one control.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled", "data-complete"],
		aria: {
			role: "group",
			conditional: ["aria-label", "aria-labelledby", "aria-describedby"],
		},
	},
	cell: {
		description:
			"Single character input. Rendered as an input[type=text] with inputmode/pattern set according to the configured type (numeric / alphanumeric / alphabetic).",
		element: "input",
		required: true,
		accepts: ["none"],
		stateAttrs: ["data-disabled", "data-filled", "data-focused", "data-index"],
		keyboard: {
			navigates: ["ArrowLeft", "ArrowRight", "Home", "End", "Backspace", "Delete", "Tab"],
			focusable: true,
		},
	},
	label: {
		description:
			"Visible label describing the pin input group. When present, root should use aria-labelledby pointing at this label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});

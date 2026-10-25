import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Radio group anatomy — mutually exclusive option selection.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/radio/
 *
 * A radio group presents a set of options where exactly one can be selected.
 * The group uses role='radiogroup', each option uses role='radio'. Only
 * one radio can have aria-checked='true' at a time.
 *
 * Keyboard:
 * - ArrowDown/ArrowRight: move to next radio and select it
 * - ArrowUp/ArrowLeft: move to previous radio and select it
 * - Tab: move focus into/out of the group (NOT between radios)
 * - Space: select the focused radio (if using roving tabindex)
 */
export const radioGroupAnatomy = createAnatomy("radio-group", {
	root: {
		description:
			"Container for mutually exclusive radio options. Uses role='radiogroup'. Manages selection state — only one radio can be checked at a time. Arrow keys move between radios.",
		element: "div",
		required: true,
		aria: {
			role: "radiogroup",
			conditional: ["aria-label", "aria-labelledby", "aria-required", "aria-orientation"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-orientation", "data-disabled"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
			focusable: true,
		},
	},
	radio: {
		description:
			"Individual radio option. Uses role='radio' with aria-checked. Only one radio in the group can be checked at a time. Arrow keys move selection between radios (NOT Tab).",
		element: "button",
		required: true,
		aria: {
			role: "radio",
			required: ["aria-checked"],
			conditional: ["aria-disabled"],
		},
		accepts: ["none"],
		stateAttrs: ["data-state", "data-disabled"],
		keyboard: {
			activates: ["Space"],
			focusable: true,
		},
		repeatable: true,
	},
	label: {
		description: "Visible label for the entire radio group. If omitted, root MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
	description: {
		description: "Help text providing context about the radio group choices.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
});

import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Combobox anatomy — text input with filterable dropdown list.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * A combobox combines a text input with a popup listbox. The user types
 * to filter options, then selects from the filtered list. Supports
 * autocomplete modes: none, list, both, inline.
 *
 * Critical distinction from Select: combobox has a TEXT INPUT that the
 * user can type into. Select only has a trigger button.
 *
 * Keyboard:
 * - ArrowDown: open listbox / move to next option
 * - ArrowUp: move to previous option
 * - Enter: select focused option
 * - Escape: close listbox
 * - Home/End: first/last option
 * - Type: filters options
 */
export const comboboxAnatomy = createAnatomy("combobox", {
	root: {
		description:
			"Container grouping the input, trigger, label, and listbox. Provides structural context for the combobox pattern.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled", "data-invalid"],
	},
	input: {
		description:
			"Text input for typing/filtering. The primary interaction element. Has role='combobox' with aria-expanded indicating listbox visibility. aria-autocomplete indicates the autocomplete behavior. aria-activedescendant tracks the focused option.",
		element: "input",
		required: true,
		aria: {
			role: "combobox",
			required: ["aria-expanded", "aria-controls"],
			conditional: [
				"aria-autocomplete",
				"aria-activedescendant",
				"aria-label",
				"aria-labelledby",
				"aria-describedby",
				"aria-invalid",
				"aria-required",
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "Home", "End"],
			dismisses: "Escape",
			focusable: true,
		},
	},
	trigger: {
		description:
			"Optional button that toggles the listbox open/closed. Typically a chevron icon. When input has focus, ArrowDown also opens the listbox.",
		element: "button",
		required: false,
		aria: {
			role: "button",
			required: ["aria-label"],
			conditional: ["aria-expanded"],
		},
		accepts: ["media"],
		stateAttrs: ["data-state"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	listbox: {
		description:
			"Popup list of selectable options. Positioned by floating UI below or above the input. Uses role='listbox'. Only rendered when expanded.",
		element: "div",
		required: true,
		aria: {
			role: "listbox",
			conditional: ["aria-label", "aria-multiselectable"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-state"],
	},
	option: {
		description:
			"Individual selectable item within the listbox. Uses role='option' with aria-selected for the currently selected value. aria-disabled for non-selectable options.",
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
	label: {
		description:
			"Visible label for the combobox. Renders as <label> with for={inputId}. If omitted, input MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});

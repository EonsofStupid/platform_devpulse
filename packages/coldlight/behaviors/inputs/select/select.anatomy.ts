import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Select anatomy — dropdown value picker.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 * (Select uses combobox pattern without text input)
 *
 * A select presents a trigger button that opens a dropdown listbox.
 * The user picks a value from the list. Unlike Combobox, there is NO
 * text input for filtering. The trigger displays the currently selected value.
 *
 * Keyboard:
 * - Space/Enter: open dropdown
 * - ArrowDown/ArrowUp: move between options (when open)
 * - Home/End: first/last option
 * - Enter: select focused option and close
 * - Escape: close without selecting
 * - Type-ahead: focus matching option
 */
export const selectAnatomy = createAnatomy("select", {
	root: {
		description: "Container grouping trigger, value display, listbox, and label.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled", "data-invalid"],
	},
	trigger: {
		description:
			"Button that opens the dropdown. Uses role='combobox' with aria-expanded. Displays the selected value or placeholder. aria-haspopup='listbox'.",
		element: "button",
		required: true,
		aria: {
			role: "combobox",
			required: ["aria-expanded", "aria-haspopup"],
			conditional: [
				"aria-label",
				"aria-labelledby",
				"aria-activedescendant",
				"aria-invalid",
				"aria-required",
			],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state", "data-disabled", "data-placeholder"],
		keyboard: {
			activates: ["Space", "Enter"],
			navigates: ["ArrowUp", "ArrowDown"],
			focusable: true,
		},
	},
	value: {
		description:
			"Display of the currently selected value text inside the trigger. Separate from trigger for independent styling.",
		element: "span",
		required: true,
		accepts: ["text"],
	},
	listbox: {
		description:
			"Dropdown panel containing selectable options. Uses role='listbox'. Positioned by floating UI.",
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
			"Selectable item in the dropdown. Uses role='option' with aria-selected. aria-disabled for non-selectable options.",
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
		description: "Visible label for the select. If omitted, trigger MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});

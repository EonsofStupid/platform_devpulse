import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Number field anatomy — numeric input with increment/decrement controls.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 *
 * A number field combines a text input with increment/decrement buttons.
 * Uses role='spinbutton' on the input for proper ARIA semantics. Supports
 * min/max bounds and step increments.
 *
 * Keyboard:
 * - ArrowUp: increment by step
 * - ArrowDown: decrement by step
 * - PageUp/PageDown: increment/decrement by larger step
 * - Home/End: jump to min/max
 * - Type: enter value directly
 */
export const numberFieldAnatomy = createAnatomy("number-field", {
	root: {
		description: "Container grouping the input and stepper buttons. Provides structural context.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-disabled", "data-invalid"],
	},
	input: {
		description:
			"Numeric text input. Uses role='spinbutton' with aria-valuenow, aria-valuemin, aria-valuemax. Accepts keyboard arrow keys for stepping.",
		element: "input",
		required: true,
		aria: {
			role: "spinbutton",
			required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
			conditional: [
				"aria-label",
				"aria-labelledby",
				"aria-describedby",
				"aria-invalid",
				"aria-required",
				"aria-disabled",
				"aria-valuetext",
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-disabled", "data-invalid"],
		keyboard: {
			navigates: ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"],
			focusable: true,
		},
	},
	increment: {
		description:
			"Button that increases the value by one step. Must have aria-label (typically 'Increase value'). Disabled when value equals max.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-label"],
			conditional: ["aria-disabled"],
		},
		accepts: ["media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	decrement: {
		description:
			"Button that decreases the value by one step. Must have aria-label (typically 'Decrease value'). Disabled when value equals min.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-label"],
			conditional: ["aria-disabled"],
		},
		accepts: ["media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});

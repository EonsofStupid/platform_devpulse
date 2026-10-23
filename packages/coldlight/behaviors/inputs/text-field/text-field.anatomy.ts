import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Text field anatomy — text input with label, description, and error.
 *
 * WAI-ARIA: Uses standard form field pattern.
 * @see https://www.w3.org/WAI/tutorials/forms/labels/
 *
 * A text field combines an input/textarea with label, description, and
 * error message. Structurally identical to Field but specific to text
 * input elements (input[type=text|email|url|tel|password] or textarea).
 *
 * ARIA wiring (managed by behavior hook):
 * - label.htmlFor = input.id
 * - description ID -> input.aria-describedby
 * - error ID -> input.aria-describedby (chained)
 * - input.aria-invalid when error present
 *
 * Keyboard: Tab focuses input. Standard text editing keys.
 */
export const textFieldAnatomy = createAnatomy("text-field", {
	root: {
		description:
			"Form field container grouping input, label, description, and error. Propagates invalid/required/disabled state to child slots via data attributes.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-invalid", "data-required", "data-disabled"],
	},
	input: {
		description:
			"Text input or textarea element. The primary interaction element. Receives the generated ID. aria-describedby chains description and error IDs.",
		element: ["input", "textarea"],
		required: true,
		aria: {
			conditional: [
				"aria-invalid",
				"aria-required",
				"aria-disabled",
				"aria-readonly",
				"aria-label",
				"aria-labelledby",
				"aria-describedby",
				"aria-placeholder",
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-invalid", "data-disabled"],
		keyboard: {
			focusable: true,
		},
	},
	label: {
		description:
			"Visible label for the text input. Renders as <label> with for={inputId}. If omitted, input MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-required", "data-disabled"],
	},
	description: {
		description:
			"Help text providing additional context. Gets ID wired to input's aria-describedby.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	error: {
		description:
			"Error message shown when validation fails. Gets ID wired to input's aria-describedby. Only visible when invalid. role='alert' with aria-live='polite' (primitive spec and useField; plan 0006 rule).",
		element: "div",
		required: false,
		aria: {
			conditional: ["aria-live"],
		},
		accepts: ["text"],
		stateAttrs: ["data-invalid"],
	},
});

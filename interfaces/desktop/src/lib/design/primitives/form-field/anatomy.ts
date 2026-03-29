import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * FormField anatomy — enhanced field with validation binding.
 *
 * WAI-ARIA: https://www.w3.org/WAI/tutorials/forms/
 *
 * A form-field extends the field pattern with form-level validation
 * integration. It automatically wires validation messages from the
 * parent form's validation state to the error slot. Structurally
 * identical to field but with additional validation-specific slots.
 *
 * Keyboard:
 * - Tab: focus to control
 * - Label click: focus control
 */
export const formFieldAnatomy = createAnatomy("form-field", {
	root: {
		description:
			"Form field container. Groups label, control, description, error, and validation message into a semantic unit. Tracks validation state from the parent form.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-invalid", "data-required", "data-disabled", "data-touched", "data-dirty"],
	},
	label: {
		description:
			"Visible label for the form control. Renders as <label> with htmlFor={controlId}. Clicking focuses the control.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-required", "data-disabled"],
	},
	control: {
		description:
			"The form input element. Receives the generated ID. aria-describedby chains description and error IDs. aria-invalid set when validation fails.",
		element: ["input", "textarea", "select", "button"],
		required: true,
		aria: {
			conditional: [
				"aria-invalid",
				"aria-required",
				"aria-disabled",
				"aria-label",
				"aria-labelledby",
				"aria-describedby",
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-invalid", "data-disabled"],
		keyboard: {
			focusable: true,
		},
	},
	description: {
		description:
			"Help text providing guidance about the expected input. Gets ID wired to control's aria-describedby.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	error: {
		description:
			"Validation error message. Gets ID wired to control's aria-describedby. Only visible when field is invalid. Uses aria-live='assertive' to announce to screen readers.",
		element: "div",
		required: false,
		aria: {
			conditional: ["aria-live"],
		},
		accepts: ["text"],
		stateAttrs: ["data-invalid"],
	},
});

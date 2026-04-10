import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * FormField anatomy — enhanced field with form-level validation binding.
 *
 * WAI-ARIA: https://www.w3.org/WAI/tutorials/forms/
 */
export const formFieldAnatomy = createAnatomy("form-field", {
	root: {
		description: "Form field container with form-level validation integration.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-invalid", "data-required", "data-disabled", "data-touched", "data-dirty"],
	},
	label: {
		description: "Visible label for the form control. Renders as <label> with htmlFor={controlId}.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-required", "data-disabled"],
	},
	control: {
		description:
			"The form input element. Receives the generated ID. aria-invalid set when validation fails.",
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
		keyboard: { focusable: true },
	},
	description: {
		description: "Help text providing guidance about the expected input.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	error: {
		description:
			"Validation error message. Uses aria-live='assertive' to announce to screen readers.",
		element: "div",
		required: false,
		aria: { conditional: ["aria-live"] },
		accepts: ["text"],
		stateAttrs: ["data-invalid"],
	},
});

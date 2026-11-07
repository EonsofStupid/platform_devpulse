import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Form anatomy — container for form fields with validation and submission.
 *
 * WAI-ARIA: https://www.w3.org/WAI/tutorials/forms/
 *
 * A form groups related fields, manages validation state, and handles
 * submission. Uses the native <form> element for built-in browser
 * validation and submission behavior. Fields within a form inherit
 * disabled state from the form.
 *
 * Keyboard:
 * - Enter: submits the form (when focus is on a single-line input)
 * - Tab: moves between form fields
 */
export const formAnatomy = createAnatomy("form", {
	root: {
		description:
			"Native <form> element. Groups related fields and manages submission. Prevents default submission to handle it programmatically. aria-label or aria-labelledby when the form has no visible heading.",
		element: "form",
		required: true,
		aria: {
			conditional: ["aria-label", "aria-labelledby", "aria-describedby"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-submitting", "data-invalid"],
	},
	actions: {
		description:
			"Container for submit/reset/cancel buttons. Typically at the bottom of the form. Groups action buttons for consistent layout.",
		element: "div",
		required: false,
		accepts: ["interactive"],
	},
});

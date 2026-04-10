import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Form anatomy — container for form fields with validation and submission.
 *
 * WAI-ARIA: https://www.w3.org/WAI/tutorials/forms/
 */
export const formAnatomy = createAnatomy("form", {
	root: {
		description:
			"Native <form> element. Groups related fields and manages submission. Prevents default submission for programmatic handling.",
		element: "form",
		required: true,
		aria: { conditional: ["aria-label", "aria-labelledby", "aria-describedby"] },
		accepts: ["structural"],
		stateAttrs: ["data-submitting", "data-invalid"],
	},
	actions: {
		description: "Container for submit/reset/cancel buttons at the bottom of the form.",
		element: "div",
		required: false,
		accepts: ["interactive"],
	},
});

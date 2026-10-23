import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Textarea anatomy — multi-line text input.
 *
 * WAI-ARIA: Standard form field pattern with <textarea> element.
 */
export const textareaAnatomy = createAnatomy("textarea", {
	root: {
		description: "Field container grouping textarea, label, description, and error.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-invalid", "data-required", "data-disabled"],
	},
	input: {
		description: "Multi-line text input. Uses native <textarea> element.",
		element: "textarea",
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
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-invalid", "data-disabled", "data-readonly"],
		keyboard: { focusable: true },
	},
	label: {
		description: "Visible label for the textarea. Renders as <label> with for={textareaId}.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-required", "data-disabled"],
	},
	description: {
		description: "Help text providing context about the expected input.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	error: {
		description:
			"Error message shown when validation fails: role='alert', aria-live='polite' (primitive spec and useField).",
		element: "div",
		required: false,
		aria: { conditional: ["aria-live"] },
		accepts: ["text"],
		stateAttrs: ["data-invalid"],
	},
	counter: {
		description: "Character count display showing current/max characters.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
});

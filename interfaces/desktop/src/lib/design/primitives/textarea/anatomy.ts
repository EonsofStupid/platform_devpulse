import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Textarea anatomy — multi-line text input.
 *
 * WAI-ARIA: Standard form field pattern with <textarea> element.
 *
 * A textarea provides multi-line text input. Structurally similar to
 * text-field but uses <textarea> instead of <input>. Supports auto-resize,
 * character counting, and all standard field slots (label, description, error).
 *
 * Keyboard:
 * - Standard text editing (Enter creates newline, NOT submit)
 * - Tab: moves focus out (does NOT insert tab character)
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
		description:
			"Multi-line text input. Uses native <textarea> element. aria-describedby chains description and error IDs. Supports auto-resize via CSS or JS.",
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
		stateAttrs: ["data-invalid", "data-disabled"],
		keyboard: {
			focusable: true,
		},
	},
	label: {
		description:
			"Visible label for the textarea. Renders as <label> with for={textareaId}. If omitted, textarea MUST have aria-label.",
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
			"Error message shown when validation fails. Uses aria-live='assertive' to announce.",
		element: "div",
		required: false,
		aria: {
			conditional: ["aria-live"],
		},
		accepts: ["text"],
		stateAttrs: ["data-invalid"],
	},
	counter: {
		description:
			"Character count display showing current/max characters. Decorative — the actual limit is enforced on the textarea via maxlength.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
});

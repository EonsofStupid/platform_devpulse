import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Field anatomy — form field container with label, control, description, and error.
 *
 * The field primitive provides the structural contract for ALL form inputs —
 * text fields, selects, comboboxes, date pickers, etc. It wires the ARIA
 * relationships between label, control, description, and error automatically.
 *
 * ARIA wiring (managed by useField behavior hook):
 * - control gets a generated ID
 * - label.htmlFor = control.id
 * - description gets ID "{control.id}-description"
 * - error gets ID "{control.id}-error"
 * - control.aria-describedby chains description + error IDs
 * - control.aria-invalid set when error is present
 *
 * @see https://www.w3.org/WAI/tutorials/forms/labels/
 *
 * Keyboard: Tab moves focus to control. Label click focuses control.
 */
export const fieldAnatomy = createAnatomy("field", {
	root: {
		description:
			"Form field container. Groups label, control, description, and error into a semantic unit. Does NOT have a role — it's a structural wrapper. Invalid/required/disabled states propagate to child slots via data attributes.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-invalid", "data-required", "data-disabled"],
	},
	label: {
		description:
			"Visible label for the form control. Renders as <label> with htmlFor={controlId}. Clicking focuses the associated control. Required for accessibility — if omitted, control MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-required", "data-disabled"],
	},
	control: {
		description:
			"The actual form input element — text input, textarea, select, etc. Receives the generated ID. aria-describedby chains description and error IDs. aria-invalid set when field has errors.",
		element: ["input", "textarea", "select", "button"],
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
		stateAttrs: ["data-invalid", "data-required", "data-disabled", "data-readonly"],
		keyboard: {
			focusable: true,
		},
	},
	description: {
		description:
			"Help text providing additional context about the field. Gets ID '{controlId}-description' which is wired to control's aria-describedby. Optional — only render when guidance is needed.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	error: {
		description:
			"Error message shown when validation fails. Gets ID '{controlId}-error' which is wired to control's aria-describedby. Only visible when field is invalid. Uses aria-live='assertive' to announce errors to screen readers.",
		element: "div",
		required: false,
		aria: {
			conditional: ["aria-live"],
		},
		accepts: ["text"],
		stateAttrs: ["data-invalid"],
	},
});

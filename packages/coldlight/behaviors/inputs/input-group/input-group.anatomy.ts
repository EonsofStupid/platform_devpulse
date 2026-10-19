import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Input group anatomy — field with prefix/suffix addons.
 *
 * An input group wraps a form input with visual addons on left (prefix) and/or right (suffix).
 */
export const inputGroupAnatomy = createAnatomy("input-group", {
	root: {
		description: "Container that visually groups the input with its prefix/suffix addons.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-focused", "data-disabled", "data-invalid"],
	},
	prefix: {
		description: "Leading addon — icon, text label, or interactive element.",
		element: "div",
		required: false,
		accepts: ["text", "media", "interactive"],
	},
	input: {
		description: "The form input element within the group.",
		element: ["input", "select"],
		required: true,
		aria: {
			conditional: [
				"aria-label",
				"aria-labelledby",
				"aria-describedby",
				"aria-invalid",
				"aria-required",
				"aria-disabled",
			],
		},
		accepts: ["none"],
		keyboard: { focusable: true },
	},
	suffix: {
		description: "Trailing addon — icon, text label, or interactive element.",
		element: "div",
		required: false,
		accepts: ["text", "media", "interactive"],
	},
});

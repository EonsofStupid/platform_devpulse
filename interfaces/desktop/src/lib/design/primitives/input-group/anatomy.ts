import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Input group anatomy — field with prefix/suffix addons.
 *
 * An input group wraps a form input with visual addons (icons, text,
 * buttons) on the left (prefix) and/or right (suffix). Addons are
 * visually connected to the input to form a cohesive unit.
 *
 * Keyboard:
 * - Tab: focus to input (addons are not independently focusable unless interactive)
 */
export const inputGroupAnatomy = createAnatomy("input-group", {
	root: {
		description:
			"Container that visually groups the input with its prefix/suffix addons into a cohesive unit. Typically styled with shared border/background.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-focused", "data-disabled", "data-invalid"],
	},
	prefix: {
		description:
			"Leading addon — icon, text label, or interactive element (e.g., currency symbol, search icon, dropdown). When decorative, use aria-hidden.",
		element: "div",
		required: false,
		accepts: ["text", "media", "interactive"],
	},
	input: {
		description:
			"The form input element within the group. Standard input behavior and ARIA attributes.",
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
		keyboard: {
			focusable: true,
		},
	},
	suffix: {
		description:
			"Trailing addon — icon, text label, or interactive element (e.g., unit label, clear button, copy button). When decorative, use aria-hidden.",
		element: "div",
		required: false,
		accepts: ["text", "media", "interactive"],
	},
});

import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Color field anatomy — text input for entering color values.
 *
 * WAI-ARIA: Uses standard text input pattern with color-specific semantics.
 *
 * A color field accepts color values as text (hex, rgb, oklch, etc.) and
 * displays a swatch preview of the parsed color. The swatch is decorative —
 * the input is the primary interaction element.
 *
 * Keyboard:
 * - Standard text input keyboard behavior
 * - Tab: focus to input
 */
export const colorFieldAnatomy = createAnatomy("color-field", {
	root: {
		description:
			"Container for the color field. Groups input, label, and swatch into a semantic unit.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-invalid", "data-disabled"],
	},
	input: {
		description:
			"Text input for entering color values (hex, rgb, oklch, etc.). The primary interaction element. Validates color format on change.",
		element: "input",
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
	label: {
		description:
			"Visible label for the color field. Renders as <label> with for={inputId}. If omitted, input MUST have aria-label.",
		element: "label",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
	swatch: {
		description:
			"Color preview displaying the current parsed value. Purely decorative — hidden from assistive technology. Background color set via inline style from the parsed value.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
	},
});

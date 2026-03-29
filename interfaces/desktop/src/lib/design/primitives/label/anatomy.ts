import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Label anatomy — form control label providing accessible name.
 *
 * Labels are the primary mechanism for providing accessible names to form
 * controls. The `for` attribute creates a programmatic association between
 * the label and its control — clicking the label focuses/activates the control.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
 *
 * Keyboard: Clicking label focuses associated control. Not independently focusable.
 */
export const labelAnatomy = createAnatomy("label", {
	root: {
		description:
			"Form control label. Renders as a semantic <label> element. The 'for' attribute MUST match the associated control's ID to create a programmatic relationship. Clicking the label focuses or activates the associated control.",
		element: "label",
		required: true,
		accepts: ["text"],
		stateAttrs: ["data-disabled", "data-required"],
	},
});

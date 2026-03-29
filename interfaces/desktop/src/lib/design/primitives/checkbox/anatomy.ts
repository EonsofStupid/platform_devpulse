import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Checkbox anatomy — tri-state selection control.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 *
 * Three states: checked, unchecked, indeterminate.
 * Renders as a button (not native input) for full visual control.
 * The indicator shows the check/dash/empty visual. The label provides
 * the accessible name.
 *
 * Keyboard: Space toggles state. Tab for focus. No Enter (per APG spec).
 */
export const checkboxAnatomy = createAnatomy("checkbox", {
	root: {
		description:
			"Tri-state selection control. Renders as a button with role='checkbox'. Tracks checked/unchecked/indeterminate via aria-checked ('true'|'false'|'mixed'). Visual state via data-state.",
		element: "button",
		required: true,
		aria: {
			role: "checkbox",
			required: ["aria-checked"],
			conditional: [
				"aria-disabled",
				"aria-required",
				"aria-label",
				"aria-labelledby",
				"aria-describedby",
			],
		},
		accepts: ["none"],
		stateAttrs: ["data-state", "data-disabled"],
		keyboard: {
			activates: ["Space"],
			focusable: true,
		},
	},
	indicator: {
		description:
			"Visual state indicator — renders the checkmark (checked), dash (indeterminate), or empty (unchecked) icon. Purely decorative — hidden from assistive technology.",
		element: "span",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
		stateAttrs: ["data-state"],
	},
	label: {
		description:
			"Visible text label for the checkbox. Clicking the label toggles the checkbox. If omitted, root MUST have aria-label or aria-labelledby.",
		element: "span",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});

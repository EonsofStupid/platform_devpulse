import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Switch anatomy — binary on/off toggle with a sliding thumb.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 *
 * Unlike checkbox (tri-state), switch is strictly binary (on/off).
 * The thumb slides to visually communicate state. The label provides
 * the accessible name.
 *
 * Keyboard: Space toggles. Enter toggles (per switch APG, unlike checkbox).
 * Tab for focus.
 */
export const switchAnatomy = createAnatomy("switch", {
	root: {
		description:
			"Binary on/off toggle control. Renders as a button with role='switch'. Uses aria-checked ('true'|'false') — NOT aria-pressed. Visual state via data-state='checked'|'unchecked'.",
		element: "button",
		required: true,
		aria: {
			role: "switch",
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
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	thumb: {
		description:
			"Sliding thumb indicator — moves to visually show on/off state. Purely decorative. Hidden from assistive technology.",
		element: "span",
		required: true,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
	label: {
		description:
			"Visible text label for the switch. Clicking the label toggles the switch. If omitted, root MUST have aria-label or aria-labelledby.",
		element: "span",
		required: false,
		accepts: ["text"],
		stateAttrs: ["data-disabled"],
	},
});

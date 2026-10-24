import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Toggle anatomy — pressable on/off control.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 * (Toggle buttons are buttons with aria-pressed)
 *
 * Keyboard: Space/Enter toggle state. Tab for focus.
 */
export const toggleAnatomy = createAnatomy("toggle", {
	root: {
		description:
			"Pressable on/off control. Renders as a button with aria-pressed tracking the toggled state. Visual state communicated via data-state='on'|'off'.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-pressed"],
			conditional: ["aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state", "data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});

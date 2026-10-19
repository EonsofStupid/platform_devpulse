import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Button anatomy — clickable control that triggers an action.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 *
 * Three modes:
 * - Standard: click fires action
 * - Toggle: aria-pressed tracks on/off state
 * - Menu trigger: aria-expanded tracks popup state
 *
 * Keyboard: Space/Enter activate. Tab for focus.
 */
export const buttonAnatomy = createAnatomy("button", {
	root: {
		description:
			"Clickable control that triggers an action. The semantic root — no wrapper elements. Supports standard, toggle (aria-pressed), and menu trigger (aria-expanded) modes.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			conditional: ["aria-pressed", "aria-expanded", "aria-disabled", "aria-busy", "aria-label"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled", "data-loading", "data-state"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	icon: {
		description:
			"Decorative icon slot — hidden from assistive technology via aria-hidden='true'. Place before or after label for leading/trailing icon.",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
	label: {
		description:
			"Visible text label describing the button action. If omitted, the root element MUST have aria-label for accessibility.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
});

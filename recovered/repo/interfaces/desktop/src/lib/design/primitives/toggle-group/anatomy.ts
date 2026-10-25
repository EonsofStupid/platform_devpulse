import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Toggle group anatomy — group of toggle buttons with single/multi selection.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 * (Toggle group uses toolbar pattern with aria-pressed toggles)
 *
 * A toggle group presents a set of toggle buttons where one or more
 * can be pressed. In "single" mode, it behaves like a segmented control
 * (radio-like). In "multiple" mode, any combination can be pressed.
 *
 * Keyboard:
 * - ArrowRight/ArrowLeft: move between toggles
 * - Space/Enter: toggle the focused item
 * - Tab: move in/out of the group
 */
export const toggleGroupAnatomy = createAnatomy("toggle-group", {
	root: {
		description:
			"Container for toggle buttons. Uses role='toolbar' or role='group'. Manages selection state and keyboard navigation between items. Only one item is tabbable at a time (roving tabindex).",
		element: "div",
		required: true,
		aria: {
			role: "toolbar",
			conditional: ["aria-label", "aria-labelledby", "aria-orientation"],
		},
		accepts: ["interactive"],
		stateAttrs: ["data-orientation", "data-disabled"],
		keyboard: {
			navigates: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
			focusable: true,
		},
	},
	item: {
		description:
			"Individual toggle button within the group. Uses aria-pressed to track on/off state. In single mode, only one item can be pressed at a time.",
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
		repeatable: true,
	},
});

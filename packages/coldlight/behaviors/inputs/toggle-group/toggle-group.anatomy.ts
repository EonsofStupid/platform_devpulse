import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Toggle group anatomy — group of toggle buttons with single/multi selection.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */
export const toggleGroupAnatomy = createAnatomy("toggle-group", {
	root: {
		description:
			"Container for toggle buttons. Uses role='toolbar'. Manages selection state and keyboard navigation.",
		element: "div",
		required: true,
		aria: { role: "toolbar", conditional: ["aria-label", "aria-labelledby", "aria-orientation"] },
		accepts: ["interactive"],
		stateAttrs: ["data-orientation", "data-disabled"],
		keyboard: {
			navigates: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
			focusable: true,
		},
	},
	item: {
		description: "Individual toggle button. Uses aria-pressed to track on/off state.",
		element: "button",
		required: true,
		aria: { role: "button", required: ["aria-pressed"], conditional: ["aria-disabled"] },
		accepts: ["text", "media"],
		stateAttrs: ["data-state", "data-disabled"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
		repeatable: true,
	},
});

import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Toolbar anatomy — grouping of action controls.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * A toolbar groups related action controls (buttons, toggles, menus)
 * into a single navigation unit. Arrow keys move between items within
 * the toolbar (Tab moves in/out of the toolbar as a whole).
 *
 * Keyboard:
 * - ArrowRight/ArrowLeft: move between items (horizontal)
 * - ArrowDown/ArrowUp: move between items (vertical)
 * - Home/End: first/last item
 * - Tab: move in/out of toolbar
 */
export const toolbarAnatomy = createAnatomy("toolbar", {
	root: {
		description:
			"Toolbar container grouping related action controls. Uses role='toolbar' with aria-orientation. Arrow keys navigate between items. Only one item is tabbable at a time (roving tabindex).",
		element: "div",
		required: true,
		aria: {
			role: "toolbar",
			conditional: ["aria-label", "aria-labelledby", "aria-orientation"],
		},
		accepts: ["interactive"],
		stateAttrs: ["data-orientation"],
		keyboard: {
			navigates: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
			focusable: true,
		},
	},
	item: {
		description:
			"Individual control within the toolbar. Can be a button, toggle, menu trigger, or other interactive element. Part of the roving tabindex navigation.",
		element: ["button", "div"],
		required: true,
		accepts: ["text", "media"],
		stateAttrs: ["data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
		repeatable: true,
	},
});

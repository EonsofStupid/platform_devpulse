import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Tabs anatomy — tabbed interface for switching between content panels.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 *
 * Tabs organize content into panels, one visible at a time. The tablist
 * contains tab triggers, each associated with a content panel. Supports
 * automatic (select on focus) and manual (select on activation) modes.
 *
 * Keyboard:
 * - ArrowRight/ArrowLeft: move between tabs (horizontal)
 * - ArrowDown/ArrowUp: move between tabs (vertical)
 * - Home/End: first/last tab
 * - Space/Enter: activate tab (manual mode only)
 * - Tab: move from tablist to active panel content
 */
export const tabsAnatomy = createAnatomy("tabs", {
	root: {
		description:
			"Container grouping the tablist and content panels. Manages which tab is active and which panel is visible.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-orientation"],
	},
	list: {
		description:
			"Tab strip containing tab triggers. Uses role='tablist'. Manages keyboard navigation between tabs. Only one tab is focusable at a time (roving tabindex).",
		element: "div",
		required: true,
		aria: {
			role: "tablist",
			conditional: ["aria-label", "aria-labelledby", "aria-orientation"],
		},
		accepts: ["interactive"],
		stateAttrs: ["data-orientation"],
		keyboard: {
			navigates: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
			focusable: true,
		},
	},
	trigger: {
		description:
			"Individual tab button. Uses role='tab' with aria-selected. aria-controls points to the associated content panel. Only the active tab has tabindex='0', others have tabindex='-1'.",
		element: "button",
		required: true,
		aria: {
			role: "tab",
			required: ["aria-selected", "aria-controls"],
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
	content: {
		description:
			"Content panel associated with a tab. Uses role='tabpanel' with aria-labelledby pointing to the tab trigger. Only the active panel is visible. Receives focus on Tab from tablist.",
		element: "div",
		required: true,
		aria: {
			role: "tabpanel",
			required: ["aria-labelledby"],
		},
		accepts: ["any"],
		stateAttrs: ["data-state"],
		keyboard: {
			focusable: true,
		},
		repeatable: true,
	},
});

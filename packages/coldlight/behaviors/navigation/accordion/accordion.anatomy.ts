import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Accordion anatomy — vertically stacked disclosure panels.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
 *
 * Each item has a trigger (heading button) that toggles its content panel.
 * Supports single-expand or multi-expand modes.
 *
 * Keyboard:
 * - Enter/Space: toggle focused trigger
 * - ArrowDown/ArrowUp: move between triggers
 * - Home/End: first/last trigger
 */
export const accordionAnatomy = createAnatomy("accordion", {
	root: {
		description:
			"Container for accordion items. Groups related disclosure panels. Manages which items are expanded via controlled or uncontrolled state.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-orientation"],
	},
	item: {
		description:
			"Individual accordion section. Contains one trigger and one content panel. Tracks expanded/collapsed state.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-state", "data-disabled"],
		repeatable: true,
	},
	trigger: {
		description:
			"Button that toggles the associated content panel. Wrapped in a heading element for document outline. Sets aria-expanded and aria-controls.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-expanded", "aria-controls"],
			conditional: ["aria-disabled"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state", "data-disabled"],
		keyboard: {
			activates: ["Space", "Enter"],
			navigates: ["ArrowUp", "ArrowDown", "Home", "End"],
			focusable: true,
		},
	},
	content: {
		description:
			"Collapsible content panel associated with a trigger. Uses aria-labelledby to reference the trigger. Animated open/close via data-state.",
		element: "div",
		required: true,
		aria: {
			role: "region",
			required: ["aria-labelledby"],
		},
		accepts: ["any"],
		stateAttrs: ["data-state"],
	},
});

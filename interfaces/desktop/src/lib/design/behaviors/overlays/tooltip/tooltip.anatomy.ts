import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Tooltip anatomy — supplementary text that appears on hover/focus.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 *
 * Tooltips are the SIMPLEST disclosure — they appear on hover/focus and
 * disappear on mouse leave/blur. They contain ONLY text (no interactive content).
 *
 * Critical distinctions from other disclosure patterns:
 * - NOT focusable (the trigger is focusable, tooltip appears as supplementary)
 * - NO close button (disappears automatically)
 * - Text-only content (no buttons, links, or form controls)
 * - Uses aria-describedby on trigger (NOT aria-labelledby)
 * - Appears on hover AND focus (both mouse and keyboard users)
 *
 * Keyboard:
 * - Focus on trigger: tooltip appears
 * - Blur from trigger: tooltip disappears
 * - Escape: dismiss tooltip while trigger retains focus
 */
export const tooltipAnatomy = createAnatomy("tooltip", {
	trigger: {
		description:
			"Element that the tooltip describes. Sets aria-describedby pointing to the tooltip content ID. The trigger is NOT modified by the tooltip — tooltip provides supplementary info about whatever the trigger already is.",
		element: ["button", "a", "span", "div"],
		required: true,
		aria: {
			conditional: ["aria-describedby"],
		},
		accepts: ["any"],
		keyboard: {
			focusable: true,
		},
	},
	content: {
		description:
			"Tooltip text that appears on hover/focus. Text-only — NO interactive content (links, buttons, inputs). Positioned by floating UI. Uses role='tooltip'. Gets a generated ID wired to trigger's aria-describedby.",
		element: "div",
		required: true,
		aria: {
			role: "tooltip",
		},
		accepts: ["text"],
		stateAttrs: ["data-state"],
	},
});

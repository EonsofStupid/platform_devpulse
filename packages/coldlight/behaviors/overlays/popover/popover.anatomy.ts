import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Popover anatomy — floating content anchored to a trigger.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * (Non-modal popovers use dialog pattern without modal semantics)
 *
 * A popover floats near its trigger element. Unlike dialog/sheet, popovers:
 * - Can be non-modal (background still interactive)
 * - Are positioned relative to their trigger (floating UI)
 * - Often have an arrow pointing to the trigger
 * - Close on outside click by default
 *
 * Use for: dropdown menus, contextual help, preview cards, date pickers.
 *
 * Keyboard:
 * - Escape: close popover, return focus to trigger
 * - When modal: Tab traps focus inside content
 * - When non-modal: Tab moves through content then out to page
 */
export const popoverAnatomy = createAnatomy("popover", {
	trigger: {
		description:
			"Element that opens the popover. Sets aria-expanded and aria-haspopup. The popover is positioned relative to this element.",
		element: "button",
		required: true,
		aria: {
			role: "button",
			required: ["aria-haspopup"],
			conditional: ["aria-expanded"],
		},
		accepts: ["text", "media"],
		stateAttrs: ["data-state"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	content: {
		description:
			"Floating content panel positioned relative to trigger. When modal, traps focus. When non-modal, focus flows naturally. Must have role='dialog' for accessibility.",
		element: "div",
		required: true,
		aria: {
			role: "dialog",
			conditional: ["aria-modal", "aria-label", "aria-labelledby"],
		},
		accepts: ["any"],
		stateAttrs: ["data-state"],
		keyboard: {
			dismisses: "Escape",
			focusable: true,
		},
	},
	arrow: {
		description:
			"Visual arrow pointing from the popover toward the trigger. Purely decorative — positioned by floating UI logic. Hidden from assistive technology.",
		element: "div",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["none"],
	},
	close: {
		description:
			"Close button inside the popover. Must have aria-label since typically icon-only. Returns focus to trigger on activation.",
		element: "button",
		required: false,
		aria: {
			role: "button",
			required: ["aria-label"],
		},
		accepts: ["media"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
});

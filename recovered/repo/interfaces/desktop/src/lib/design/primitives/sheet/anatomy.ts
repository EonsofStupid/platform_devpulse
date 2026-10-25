import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Sheet anatomy — sliding panel from screen edge.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * (Sheets are modal dialogs that slide in from a screen edge)
 *
 * A sheet slides in from top, right, bottom, or left. Structurally identical
 * to dialog (trigger, overlay, content, title, description, close) but with
 * a `side` attribute controlling slide direction.
 *
 * Focus behavior is identical to dialog: trapped, returns to trigger on close.
 *
 * Keyboard:
 * - Tab/Shift+Tab: cycle focus within content (trapped)
 * - Escape: close sheet
 * - Focus returns to trigger on close
 */
export const sheetAnatomy = createAnatomy("sheet", {
	trigger: {
		description:
			"Button that opens the sheet. Sets aria-expanded and aria-haspopup='dialog'. Receives focus when sheet closes.",
		element: "button",
		required: false,
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
	overlay: {
		description:
			"Visual backdrop — dims background content. Clicking closes the sheet (when closeOnOutsideClick is true).",
		element: "div",
		required: false,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
	content: {
		description:
			"Sliding panel container. Enters from the edge specified by data-side (top|right|bottom|left). Focus trapped inside. Must have role='dialog' with aria-modal and aria-labelledby.",
		element: "div",
		required: true,
		aria: {
			role: "dialog",
			required: ["aria-modal", "aria-labelledby"],
			conditional: ["aria-describedby"],
		},
		accepts: ["any"],
		stateAttrs: ["data-state", "data-side"],
		keyboard: {
			dismisses: "Escape",
			focusable: true,
		},
	},
	title: {
		description:
			"Sheet title — provides accessible name via aria-labelledby. Must be present for accessibility.",
		element: ["h2", "h3"],
		required: true,
		accepts: ["text"],
	},
	description: {
		description: "Sheet description — additional context via aria-describedby. Optional.",
		element: "p",
		required: false,
		accepts: ["text"],
	},
	close: {
		description:
			"Close button — dismisses the sheet and returns focus to trigger. Must have aria-label since typically icon-only.",
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

import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Dialog anatomy — modal overlay for focused interactions.
 *
 * WAI-ARIA: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 *
 * A dialog is a modal window that overlays the page. When open:
 * - Focus is trapped inside the content
 * - Background is inert (not interactable)
 * - Escape key closes the dialog
 * - Scroll is locked on the body
 * - Focus returns to trigger on close
 *
 * Uses the native `<dialog>` element for built-in modal behavior,
 * with a custom overlay for visual backdrop control.
 *
 * Keyboard:
 * - Tab/Shift+Tab: cycle focus within content (trapped)
 * - Escape: close dialog
 * - Focus returns to trigger element on close
 */
export const dialogAnatomy = createAnatomy("dialog", {
	trigger: {
		description:
			"Button that opens the dialog. Sets aria-expanded and aria-haspopup='dialog'. Receives focus when dialog closes. Can be omitted if dialog is opened programmatically.",
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
			"Visual backdrop behind the dialog — dims the page content. Clicking the overlay closes the dialog (when closeOnOutsideClick is true). Prevents interaction with background content.",
		element: "div",
		required: false,
		accepts: ["none"],
		stateAttrs: ["data-state"],
	},
	content: {
		description:
			"The dialog container — renders as a native <dialog> element for built-in modal behavior. Focus is trapped inside when open. Must contain at least a title for accessibility. aria-labelledby points to the title, aria-describedby points to the description.",
		element: "dialog",
		required: true,
		aria: {
			role: "dialog",
			required: ["aria-modal", "aria-labelledby"],
			conditional: ["aria-describedby"],
		},
		accepts: ["any"],
		stateAttrs: ["data-state"],
		keyboard: {
			dismisses: "Escape",
			focusable: true,
		},
	},
	title: {
		description:
			"Dialog title — provides the accessible name via aria-labelledby. Must be present for accessibility even if visually hidden. Renders as a heading element.",
		element: ["h2", "h3", "h4"],
		required: true,
		accepts: ["text"],
	},
	description: {
		description:
			"Dialog description — provides additional context via aria-describedby. Optional. Renders as a paragraph.",
		element: "p",
		required: false,
		accepts: ["text"],
	},
	close: {
		description:
			"Close button — dismisses the dialog and returns focus to the trigger. Must have aria-label (typically 'Close') since it usually renders as an icon-only button.",
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

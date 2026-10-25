import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Toaster anatomy — toast notification container and individual toasts.
 *
 * WAI-ARIA: role="status" with aria-live="polite" for the container.
 * Individual toasts use role="alert" for urgent messages.
 *
 * A toaster manages a stack of toast notifications. Toasts appear temporarily,
 * auto-dismiss after a timeout, and can be manually dismissed. The container
 * is a live region that announces new toasts to screen readers.
 *
 * Keyboard:
 * - Tab: focus moves to toast actions (when present)
 * - Escape: dismiss focused toast
 */
export const toasterAnatomy = createAnatomy("toaster", {
	root: {
		description:
			"Toast notification container. Positioned fixed at a screen edge. Uses role='status' with aria-live='polite' to announce new toasts. Contains the stack of active toast elements.",
		element: "div",
		required: true,
		aria: {
			role: "status",
			required: ["aria-live"],
			conditional: ["aria-label"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-position"],
	},
	toast: {
		description:
			"Individual toast notification. Contains title, description, action, and close. Auto-dismisses after timeout. Uses role='alert' for urgent toasts.",
		element: "div",
		required: true,
		aria: {
			conditional: ["role"],
		},
		accepts: ["structural"],
		stateAttrs: ["data-state", "data-type"],
		repeatable: true,
	},
	title: {
		description: "Toast title — brief summary of the notification.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	description: {
		description: "Toast description — additional detail about the notification.",
		element: "div",
		required: false,
		accepts: ["text"],
	},
	action: {
		description:
			"Optional action button within the toast (e.g., 'Undo', 'View'). Must have aria-label if icon-only.",
		element: "button",
		required: false,
		accepts: ["text", "media"],
		keyboard: {
			activates: ["Space", "Enter"],
			focusable: true,
		},
	},
	close: {
		description: "Dismiss button for the toast. Must have aria-label (typically 'Dismiss').",
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

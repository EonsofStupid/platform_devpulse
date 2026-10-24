import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Toaster anatomy — toast notification container and individual toasts.
 *
 * WAI-ARIA: role="status" with aria-live="polite" for the container.
 */
export const toasterAnatomy = createAnatomy("toaster", {
	root: {
		description:
			"Toast notification container. Positioned fixed at a screen edge. Uses role='status' with aria-live='polite'.",
		element: "div",
		required: true,
		aria: { role: "status", required: ["aria-live"], conditional: ["aria-label"] },
		accepts: ["structural"],
		stateAttrs: ["data-position"],
	},
	toast: {
		description: "Individual toast notification. Auto-dismisses after timeout.",
		element: "div",
		required: true,
		aria: { conditional: ["role"] },
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
		description: "Optional action button within the toast.",
		element: "button",
		required: false,
		accepts: ["text", "media"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
	},
	close: {
		description: "Dismiss button for the toast. Must have aria-label.",
		element: "button",
		required: false,
		aria: { role: "button", required: ["aria-label"] },
		accepts: ["media"],
		keyboard: { activates: ["Space", "Enter"], focusable: true },
	},
});

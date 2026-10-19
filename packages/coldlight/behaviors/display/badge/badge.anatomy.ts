import { createAnatomy } from "../../../schema/anatomy.schema.js";

/**
 * Badge anatomy — compact status indicator with optional icon and label.
 *
 * Badges communicate status, counts, or categories. Typically non-interactive.
 * Can be made removable.
 *
 * WAI-ARIA: Use role="status" when content updates dynamically (e.g., notification count).
 * Otherwise purely presentational.
 *
 * Keyboard: Not focusable by default. When removable, remove button is focusable.
 */
export const badgeAnatomy = createAnatomy("badge", {
	root: {
		description:
			"Compact inline indicator for status, counts, or categories. Renders as a span. Use role='status' with aria-live='polite' when content updates dynamically (e.g., unread count changing).",
		element: "span",
		required: true,
		aria: {
			conditional: ["aria-label", "aria-live"],
		},
		accepts: ["text", "media"],
	},
	icon: {
		description:
			"Decorative icon within the badge — hidden from assistive technology. Communicates meaning visually only (e.g., checkmark for success, warning triangle for caution).",
		element: "span",
		required: false,
		aria: { required: ["aria-hidden"] },
		accepts: ["media"],
	},
	label: {
		description:
			"Text content of the badge — the status text, count, or category name. If omitted, root MUST have aria-label.",
		element: "span",
		required: false,
		accepts: ["text"],
	},
	remove: {
		description:
			"Dismiss/remove button — only present when badge is removable. Must be focusable and keyboard-accessible (Space/Enter to remove).",
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

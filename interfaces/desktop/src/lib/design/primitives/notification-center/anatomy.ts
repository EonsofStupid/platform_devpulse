import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * Notification center anatomy — persistent notification list management.
 *
 * WAI-ARIA: Uses role="log" with aria-live="polite" for the notification list.
 * New notifications are announced without interrupting the current task.
 *
 * A notification center manages a persistent list of notifications (unlike
 * toasts which are temporary). Notifications can be read, dismissed, or
 * acted upon. Supports unread indicators and grouping.
 *
 * Keyboard:
 * - Tab: navigate between notifications
 * - Enter/Space: activate notification or its action
 * - Delete: dismiss notification
 */
export const notificationCenterAnatomy = createAnatomy("notification-center", {
	root: {
		description: "Notification center container. Groups the header, list, and empty state.",
		element: "div",
		required: true,
		accepts: ["structural"],
	},
	header: {
		description:
			"Header area with title, unread count, and bulk actions (e.g., 'Mark all read', 'Clear all').",
		element: "div",
		required: false,
		accepts: ["text", "interactive"],
	},
	list: {
		description:
			"Scrollable notification list. Uses role='log' with aria-live='polite' so new notifications are announced.",
		element: "div",
		required: true,
		aria: {
			role: "log",
			required: ["aria-live"],
			conditional: ["aria-label"],
		},
		accepts: ["structural"],
	},
	item: {
		description:
			"Individual notification entry. Contains title, message, timestamp, and optional actions. Tracks read/unread state.",
		element: "div",
		required: true,
		accepts: ["structural"],
		stateAttrs: ["data-read", "data-type"],
		repeatable: true,
	},
	dismiss: {
		description: "Dismiss button for an individual notification. Must have aria-label.",
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

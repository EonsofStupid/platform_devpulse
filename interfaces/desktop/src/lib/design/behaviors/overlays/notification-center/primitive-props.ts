import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/**
 * Structural props for the NotificationCenter primitive.
 *
 * A notification center manages a persistent list of notifications.
 * For temporary pop-up messages, use Toaster. For inline alerts
 * within content, use Alert or InlineMessage.
 *
 * @example
 * ```svelte
 * <div {...notificationCenterAnatomy.attrs.root}>
 *   <div {...notificationCenterAnatomy.attrs.header}>
 *     Notifications (3 unread)
 *   </div>
 *   <div {...notificationCenterAnatomy.attrs.list} role="log" aria-live="polite">
 *     <div {...notificationCenterAnatomy.attrs.item} data-read="false">
 *       New deployment completed
 *       <button {...notificationCenterAnatomy.attrs.dismiss} aria-label="Dismiss">×</button>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
export interface NotificationCenterPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the notification center */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Callback when a notification is dismissed */
	onDismiss?: (id: string) => void;
	/** Callback when all notifications are marked as read */
	onMarkAllRead?: () => void;
	/** Callback when all notifications are cleared */
	onClearAll?: () => void;
}

/**
 * @file NotificationCenter Component Types
 * @kind notification-center
 * @layer components
 *
 * Extends primitive with open/close state and accessible labelling.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { NotificationCenterPrimitiveProps } from "$lib/design/behaviors/overlays/notification-center/index.js";

export type NotificationCenterPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** NotificationCenter component props — extends primitive + preset */
export interface NotificationCenterComponentProps extends NotificationCenterPrimitiveProps {
	/** Style preset */
	preset?: NotificationCenterPreset;
	/** Whether the notification center panel is open */
	open?: boolean;
	/** Called when open state changes */
	onOpenChange?: (open: boolean) => void;
}

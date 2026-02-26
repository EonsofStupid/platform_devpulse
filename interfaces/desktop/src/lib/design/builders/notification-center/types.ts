/**
 * @file builders/notification-center/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the NotificationCenter builder.
 * Contract: role="log", aria-live="polite", aria-relevant="additions".
 * Compound builder with open/close state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for NotificationCenter builder. */
export type NotificationCenterProps = {
	/** Whether the notification center panel is open. Getter = controlled, static = uncontrolled. @default false */
	open?: MaybeGetter<boolean | undefined>;
	/** Called when open state changes. */
	onOpenChange?: (open: boolean) => void;
	/** Accessible label for the notification log region. @default "Notifications" */
	"aria-label"?: MaybeGetter<string | undefined>;
	/** ID of element that labels the notification region. */
	"aria-labelledby"?: MaybeGetter<string | undefined>;
};

/**
 * @file builders/notification-center/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the NotificationCenter builder.
 * Contract: `role="log"`, `aria-live="polite"`, `aria-relevant="additions"`.
 * Compound builder with open/close state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/**
 * Constructor config for NotificationCenter builder.
 *
 * All props support the `MaybeGetter<T>` pattern for controlled/uncontrolled usage.
 */
export type NotificationCenterProps = {
	/**
	 * Whether the notification center panel is open.
	 *
	 * Getter = controlled, static = uncontrolled.
	 *
	 * @default false
	 */
	open?: MaybeGetter<boolean | undefined>;

	/**
	 * Called when the open state changes.
	 *
	 * Receives the new open boolean value.
	 */
	onOpenChange?: (open: boolean) => void;

	/**
	 * Accessible label for the notification log region.
	 *
	 * Applied as `aria-label` on the root element when `aria-labelledby`
	 * is not provided.
	 *
	 * @default "Notifications"
	 */
	"aria-label"?: MaybeGetter<string | undefined>;

	/**
	 * ID of an element that labels the notification region.
	 *
	 * When provided, `aria-label` is suppressed in favor of `aria-labelledby`.
	 *
	 * @default undefined
	 */
	"aria-labelledby"?: MaybeGetter<string | undefined>;
};

/**
 * @file primitives/notification-center/types.ts
 * @kind notification-center
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * NotificationCenter primitive — Notification list panel with live region.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

// =============================================================================
// SLOT VOCABULARY
// =============================================================================

/** Slot names for the notification-center primitive */
export const notificationCenterSlots = ["root", "header", "list", "item", "action", "empty"] as const;
export type NotificationCenterSlot = (typeof notificationCenterSlots)[number];

// =============================================================================
// STATE VOCABULARY
// =============================================================================

/** State tokens applicable to the notification-center primitive */
export const notificationCenterStateTokens = [
	"open",
	"closed",
] as const satisfies readonly StateToken[];
export type NotificationCenterState = (typeof notificationCenterStateTokens)[number];

// =============================================================================
// SLOT STATE MAP
// =============================================================================

/** Maps each notification-center slot to its allowed state tokens */
export const notificationCenterSlotStates = {
	root: ["open", "closed"],
	header: [],
	list: [],
	item: [],
	action: [],
	empty: [],
} as const satisfies SlotStateMap<NotificationCenterSlot, NotificationCenterState>;

// =============================================================================
// COMPONENT PROPS — structural shell only
// =============================================================================

/**
 * NotificationCenterProps — props for the notification-center primitive root slot.
 *
 * Zero ARIA. Zero state logic. Zero styling.
 * The component layer applies ARIA + data-state + recipe classes.
 * The `class` prop receives recipe-generated strings from the component layer.
 */
export interface NotificationCenterProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}

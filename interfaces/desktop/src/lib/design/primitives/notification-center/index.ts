/**
 * @file primitives/notification-center/index.ts
 * @kind notification-center
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * NotificationCenter primitive barrel export.
 */

export { default as NotificationCenter } from "./NotificationCenter.svelte";
export { contract } from "./contract.js";
export { notificationCenterSlots, notificationCenterStateTokens, notificationCenterSlotStates } from "./types.js";
export type { NotificationCenterProps, NotificationCenterSlot, NotificationCenterState } from "./types.js";

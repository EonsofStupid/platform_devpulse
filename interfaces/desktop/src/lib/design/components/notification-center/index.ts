/**
 * @file NotificationCenter Component Barrel
 * @kind notification-center
 * @layer components
 */

export { contract as notificationCenterComponentContract } from "./contract.js";
export { default as NotificationCenter } from "./NotificationCenter.svelte";
export { notificationCenterComposition } from "./composition.js";
export type { NotificationCenterComponentProps } from "./types.js";

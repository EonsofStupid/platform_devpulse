/**
 * @file primitives/breadcrumb/index.ts
 * @kind breadcrumb
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Breadcrumb primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as BreadcrumbRoot } from "./Breadcrumb.svelte";
export { contract } from "./contract.js";
export { breadcrumbSlots, breadcrumbStateTokens, breadcrumbSlotStates } from "./types.js";
export type { BreadcrumbProps, BreadcrumbSlot, BreadcrumbState } from "./types.js";

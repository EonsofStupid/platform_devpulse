/**
 * @file primitives/banner/index.ts
 * @kind banner
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Banner primitive barrel export.
 * Contract lives HERE — with the implementation.
 */

export { default as BannerRoot } from "./Banner.svelte";
export { contract } from "./contract.js";
export { bannerSlots, bannerStateTokens, bannerSlotStates } from "./types.js";
export type { BannerProps, BannerSlot, BannerState } from "./types.js";

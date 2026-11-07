/**
 * @file ARIA Actions Barrel
 * @description Svelte actions for ARIA attribute application.
 *
 * These actions bridge the gap between ColdLight contracts (which DEFINE
 * ARIA requirements) and the DOM (which needs ARIA APPLIED).
 *
 * For MeltUI-backed primitives (ariaStateProvider: "meltui"), the aria
 * action is a no-op since MeltUI handles ARIA via its builder pattern.
 *
 * For ColdLight-backed primitives (ariaStateProvider: "coldlight"), the
 * aria action reads the contract's slotSpec and applies attributes.
 */

export { type AriaActionOptions, type AriaState, aria } from "./aria";
export { type AriaLinkOptions, type AriaLinkType, ariaLink } from "./aria-link";

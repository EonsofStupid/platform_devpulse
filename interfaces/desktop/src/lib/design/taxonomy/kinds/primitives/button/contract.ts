/**
 * @file Button Primitive Contract
 * @description Taxonomy SSOT contract for button kind
 *
 * Button is a ColdLight custom ARIA primitive - NOT backed by MeltUI.
 * ColdLight owns ARIA behavior directly for this kind.
 *
 * Requirements:
 * - Native <button> element preferred (free accessibility)
 * - Custom elements need role="button", tabindex="0"
 * - Keyboard: Enter and Space trigger activation
 * - aria-pressed for toggle buttons
 * - aria-disabled (not native disabled) for accessible disabled state
 * - Loading state with aria-busy
 */

import type { PrimitiveContract, SlotStateMap } from "$lib/design/taxonomy/types";

export const buttonSlots = [
  "root",
  "icon",
  "label",
] as const;

export type ButtonSlot = (typeof buttonSlots)[number];

export const buttonStateTokens = [
  // Primary
  "pressed",
  // Focus
  "focused",
  "focus-visible",
  // Interaction
  "hover",
  "active",
  // Availability
  "disabled",
  "loading",
  "busy",
] as const;

export type ButtonState = (typeof buttonStateTokens)[number];

export const buttonSlotStates: SlotStateMap<ButtonSlot, ButtonState> = {
  root: ["pressed", "focused", "focus-visible", "hover", "active", "disabled", "loading", "busy"],
  icon: ["loading"],
  label: [],
} as const;

type ButtonCollectionKey = "aria" | "keyboard";

const BUTTON_COLLECTIONS = {
  aria: {
    role: "button",
    requiredAttrs: ["aria-pressed", "aria-disabled"] as const,
    optionalAttrs: ["aria-busy", "aria-label"] as const,
  },
  keyboard: ["Enter", "Space"] as const,
} as const;

export const contract: PrimitiveContract<
  "button",
  ButtonSlot,
  ButtonState,
  ButtonCollectionKey
> = {
  kind: "button",

  // ColdLight owns ARIA directly for button (no MeltUI builder)
  ariaStateProvider: "coldlight",

  slots: {
    required: ["root"],
    optional: ["icon", "label"],
    forbidden: [],
  },

  states: {
    shared: ["focused", "focus-visible", "hover", "active", "disabled"],
    specific: ["pressed", "loading", "busy"],
  },

  slotStates: buttonSlotStates,

  slotActions: {
    root: [],
    icon: [],
    label: [],
  },

  collections: {
    get(key) {
      return BUTTON_COLLECTIONS[key];
    },
  },
};

export default contract;

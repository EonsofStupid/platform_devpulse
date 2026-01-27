/**
 * @file Button Primitive Contract
 * @description Custom ARIA button - NOT backed by MeltUI
 *
 * Button is one of the custom ARIA primitives that ColdLight owns directly.
 * MeltUI doesn't provide a button builder, so we implement full ARIA ourselves.
 *
 * Requirements:
 * - Native <button> element preferred (free accessibility)
 * - Custom elements need role="button", tabindex="0"
 * - Keyboard: Enter and Space trigger activation
 * - aria-pressed for toggle buttons
 * - aria-disabled (not native disabled) for accessible disabled state
 * - Loading state with aria-busy
 */

import type { PrimitiveContract, StateToken } from "$lib/design/taxonomy/adapters/types";

/**
 * Button Slots
 *
 * root  - The button element itself
 * icon  - Optional icon (leading or trailing)
 * label - Text content
 */
export const buttonSlots = [
  "root",
  "icon",
  "label",
] as const;

export type ButtonSlot = (typeof buttonSlots)[number];

/**
 * Button States
 *
 * Primary: Toggle button state
 * - pressed: Toggle is on (aria-pressed="true")
 *
 * Focus: Focus management
 * - focused: Has focus
 * - focus-visible: Keyboard focus indicator
 *
 * Interaction: User interaction feedback
 * - hover: Mouse over
 * - active: Being activated (mousedown/keydown)
 *
 * Availability: Disabled/loading states
 * - disabled: Cannot interact (aria-disabled="true")
 * - loading: Async operation in progress
 * - busy: aria-busy="true" for screen readers
 */
export const buttonStates = [
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
] as const satisfies readonly StateToken[];

export type ButtonState = (typeof buttonStates)[number];

/**
 * Slot-specific allowed states
 */
export const buttonSlotStates = {
  root: ["pressed", "focused", "focus-visible", "hover", "active", "disabled", "loading", "busy"] as const,
  icon: ["loading"] as const,  // Icon can show loading spinner
  label: [] as const,
} as const satisfies Record<ButtonSlot, readonly StateToken[]>;

/**
 * The full button contract
 */
export const contract: PrimitiveContract = {
  kind: "button",
  slots: buttonSlots,
  requiredSlots: ["root"],
  states: buttonStates,
  aria: {
    role: "button",
    requiredAttrs: ["aria-pressed", "aria-disabled"],
  },
  keyboard: [
    "Enter",  // Activate button
    "Space",  // Activate button
  ],
  provider: "custom",  // NOT MeltUI - ColdLight custom ARIA
} as const;

export default contract;

/**
 * @file Dialog Primitive Contract
 * @description Full contract for modal dialog - one of the most complex primitives
 *
 * Dialog requires:
 * - Portal rendering (escape DOM hierarchy)
 * - Focus trap (keyboard navigation contained)
 * - Scroll lock (body scroll disabled when open)
 * - Overlay (backdrop click to close)
 * - Animation states (enter/exit transitions)
 * - ARIA: dialog role, modal=true, labelledby, describedby
 */

import type { PrimitiveContract, StateToken, SlotStateMap } from "$lib/design/taxonomy/types";

/**
 * Dialog Slots
 *
 * root      - Logical container (manages open state)
 * trigger   - Element that opens the dialog
 * portal    - Renders content outside DOM hierarchy
 * overlay   - Backdrop behind dialog (click to close)
 * content   - The dialog panel itself
 * title     - Dialog heading (aria-labelledby target)
 * description - Dialog description (aria-describedby target)
 * close     - Close button
 */
export const dialogSlots = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "title",
  "description",
  "close",
] as const;

export type DialogSlot = (typeof dialogSlots)[number];

/**
 * Dialog States
 *
 * Presence: Controls visibility and DOM presence
 * - hidden: Not visible, may be removed from DOM
 * - visible: Rendered and visible
 * - inert: Rendered but non-interactive (during transitions)
 *
 * Primary: Core dialog state
 * - open: Dialog is open/active
 *
 * Focus: Focus management
 * - focused: Has focus
 * - focus-visible: Keyboard focus indicator
 * - focus-within: Contains focused element
 *
 * Interaction: User interaction feedback
 * - hover: Mouse over
 * - active: Being activated (mousedown/keydown)
 *
 * Animation: Transition states
 * - entering: Opening animation in progress
 * - exiting: Closing animation in progress
 */
export const dialogStates = [
  // Presence
  "hidden",
  "visible",
  "inert",
  // Primary
  "open",
  // Focus
  "focused",
  "focus-visible",
  "focus-within",
  // Interaction
  "hover",
  "active",
  // Animation
  "entering",
  "exiting",
] as const satisfies readonly StateToken[];

export type DialogState = (typeof dialogStates)[number];

/**
 * Slot-specific allowed states
 * Each slot can only have certain states applied
 */
export const dialogSlotStates: SlotStateMap<DialogSlot, DialogState> = {
  root: ["open"],
  trigger: ["focused", "focus-visible", "hover", "active"],
  portal: ["hidden", "visible"],
  overlay: ["visible", "entering", "exiting", "hover"],
  content: ["open", "focus-within", "entering", "exiting"],
  title: [],
  description: [],
  close: ["focused", "focus-visible", "hover", "active"],
};

/**
 * The full dialog contract
 */
export const contract: PrimitiveContract = {
  kind: "dialog",
  slots: dialogSlots,
  requiredSlots: ["root", "content"],
  states: dialogStates,
  aria: {
    role: "dialog",
    requiredAttrs: ["aria-modal", "aria-labelledby"],
  },
  keyboard: [
    "Escape",  // Close dialog
    "Tab",     // Navigate within (trapped)
  ],
  provider: "meltui",
};

export default contract;

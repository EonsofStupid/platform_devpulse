/**
 * @file Tabs Primitive Contract
 * @description Tabbed interface - backed by MeltUI createTabs
 *
 * Tabs provide a way to switch between different views/content panels.
 *
 * Requirements:
 * - tablist role on list container
 * - tab role on triggers
 * - tabpanel role on content panels
 * - aria-selected on active tab
 * - Arrow key navigation between tabs
 * - Automatic or manual activation modes
 */

import type { PrimitiveContract, StateToken, SlotStateMap } from "$lib/design/taxonomy/types";

/**
 * Tabs Slots
 *
 * root    - Outer container
 * list    - The tablist container (role="tablist")
 * trigger - Individual tab buttons (role="tab")
 * content - Tab panels (role="tabpanel")
 */
export const tabsSlots = [
  "root",
  "list",
  "trigger",
  "content",
] as const;

export type TabsSlot = (typeof tabsSlots)[number];

/**
 * Tabs States
 *
 * Presence: Panel visibility
 * - hidden: Panel not visible
 * - visible: Panel is shown
 *
 * Primary: Selection state
 * - selected: Tab/panel is active (aria-selected="true")
 *
 * Focus: Focus management
 * - focused: Has focus
 * - focus-visible: Keyboard focus indicator
 * - focus-within: Contains focused element
 *
 * Interaction: User interaction feedback
 * - hover: Mouse over
 * - active: Being activated
 *
 * Availability: Disabled tabs
 * - disabled: Tab cannot be selected
 */
export const tabsStates = [
  // Presence
  "hidden",
  "visible",
  // Primary
  "selected",
  // Focus
  "focused",
  "focus-visible",
  "focus-within",
  // Interaction
  "hover",
  "active",
  // Availability
  "disabled",
] as const satisfies readonly StateToken[];

export type TabsState = (typeof tabsStates)[number];

/**
 * Slot-specific allowed states
 */
export const tabsSlotStates: SlotStateMap<TabsSlot, TabsState> = {
  root: ["focus-within"],
  list: [],
  trigger: ["selected", "focused", "focus-visible", "hover", "active", "disabled"],
  content: ["hidden", "visible", "selected"],
};

/**
 * The full tabs contract
 */
export const contract: PrimitiveContract = {
  kind: "tabs",
  slots: tabsSlots,
  requiredSlots: ["root", "list", "trigger", "content"],
  states: tabsStates,
  aria: {
    role: "tablist",
    requiredAttrs: ["aria-orientation"],
  },
  keyboard: [
    "ArrowLeft",   // Previous tab (horizontal)
    "ArrowRight",  // Next tab (horizontal)
    "ArrowUp",     // Previous tab (vertical)
    "ArrowDown",   // Next tab (vertical)
    "Home",        // First tab
    "End",         // Last tab
    "Enter",       // Activate (manual mode)
    "Space",       // Activate (manual mode)
  ],
  provider: "meltui",
};

export default contract;

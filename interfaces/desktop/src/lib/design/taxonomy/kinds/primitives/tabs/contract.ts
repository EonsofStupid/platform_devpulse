/**
 * @file Tabs Primitive Contract
 * @description Taxonomy SSOT contract for tabs kind
 *
 * Tabs provide a way to switch between different views/content panels.
 * Backed by MeltUI createTabs builder.
 *
 * Requirements:
 * - tablist role on list container
 * - tab role on triggers
 * - tabpanel role on content panels
 * - aria-selected on active tab
 * - Arrow key navigation between tabs
 * - Automatic or manual activation modes
 */

import type { PrimitiveContract, SlotStateMap } from "$lib/design/taxonomy/types";

export const tabsSlots = [
  "root",
  "list",
  "trigger",
  "content",
] as const;

export type TabsSlot = (typeof tabsSlots)[number];

export const tabsStateTokens = [
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
] as const;

export type TabsState = (typeof tabsStateTokens)[number];

export const tabsSlotStates: SlotStateMap<TabsSlot, TabsState> = {
  root: ["focus-within"],
  list: [],
  trigger: ["selected", "focused", "focus-visible", "hover", "active", "disabled"],
  content: ["hidden", "visible", "selected"],
} as const;

type TabsCollectionKey = "aria" | "keyboard";

const TABS_COLLECTIONS = {
  aria: {
    role: "tablist",
    requiredAttrs: ["aria-orientation"] as const,
    optionalAttrs: ["aria-label"] as const,
  },
  keyboard: [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "Enter",
    "Space",
  ] as const,
} as const;

export const contract: PrimitiveContract<
  "tabs",
  TabsSlot,
  TabsState,
  TabsCollectionKey
> = {
  kind: "tabs",

  // MeltUI provides ARIA+state via createTabs builder
  ariaStateProvider: "meltui",

  slots: {
    required: ["root", "list", "trigger", "content"],
    optional: [],
    forbidden: [],
  },

  states: {
    shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"],
    specific: ["hidden", "visible", "selected"],
  },

  slotStates: tabsSlotStates,

  slotActions: {
    root: [],
    list: [],
    trigger: [],
    content: [],
  },

  collections: {
    get(key) {
      return TABS_COLLECTIONS[key];
    },
  },
};

export default contract;

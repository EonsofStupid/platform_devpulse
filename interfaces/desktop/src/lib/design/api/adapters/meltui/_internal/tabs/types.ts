/**
 * @file MeltUI Tabs Types
 * @description Maps MeltUI tabs builder to ColdLight slots and states.
 *
 * MeltUI's createTabs returns elements and states with their own naming.
 * This file defines the mapping from MeltUI names → ColdLight names.
 */

import type {
  TabsSlot,
  TabsState,
} from "$lib/design/taxonomy/kinds/primitives/tabs/contract";

// =============================================================================
// MELTUI ELEMENTS → COLDLIGHT SLOTS
// =============================================================================

/**
 * Element names returned by MeltUI's createTabs.
 * Note: trigger and content are FUNCTIONS, not direct stores.
 */
export const MELT_ELEMENTS = [
  "root",
  "list",
  "trigger",
  "content",
] as const;

export type MeltTabsElement = (typeof MELT_ELEMENTS)[number];

/**
 * Maps MeltUI element names to ColdLight slot names.
 * All names match 1:1 for tabs.
 */
export const ELEMENT_TO_SLOT: Record<MeltTabsElement, TabsSlot> = {
  root: "root",
  list: "list",
  trigger: "trigger",
  content: "content",
} as const;

// =============================================================================
// MELTUI STATES → COLDLIGHT STATES
// =============================================================================

/**
 * State names exposed by MeltUI's createTabs.
 */
export const MELT_STATES = ["value"] as const;

export type MeltTabsState = (typeof MELT_STATES)[number];

/**
 * Maps MeltUI state names to ColdLight state tokens.
 * MeltUI "value" → ColdLight "selected" (the selected tab value)
 */
export const STATE_TO_TOKEN: Record<MeltTabsState, TabsState> = {
  value: "selected",
} as const;

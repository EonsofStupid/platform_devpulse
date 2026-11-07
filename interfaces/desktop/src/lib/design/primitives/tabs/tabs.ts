/**
 * @file Tabs Primitive
 * @description Consolidates exports from context, types, and contract for the barrel.
 */

// =============================================================================
// CONTEXT
// =============================================================================

export type { TabsContext } from "./context.js";
export { setTabsContext, getTabsContext } from "./context.js";

// =============================================================================
// TYPES
// =============================================================================

export type {
  TabsProps,
  TabsTriggerProps,
  TabsContentProps,
  TabsSlot,
  TabsState,
} from "./types.js";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  contract as tabsContract,
  tabsSlots,
  tabsStateTokens,
  tabsSlotStates,
} from "./contract.js";

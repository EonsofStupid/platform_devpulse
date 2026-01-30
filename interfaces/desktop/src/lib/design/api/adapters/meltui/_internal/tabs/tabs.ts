/**
 * @file MeltUI Tabs
 * @description Consolidates exports from types, contract, and factory for the barrel.
 */

// =============================================================================
// TYPES
// =============================================================================

export type { MeltTabsElement, MeltTabsState } from "./types.js";

export {
  MELT_ELEMENTS,
  ELEMENT_TO_SLOT,
  MELT_STATES,
  STATE_TO_TOKEN,
} from "./types.js";

// =============================================================================
// CONTRACT
// =============================================================================

export {
  MELT_BUILDER,
  ADAPTER_ID,
  KIND,
  MELT_HANDLES,
  COLDLIGHT_ADDS,
  SLOTS,
} from "./contract.js";

// =============================================================================
// FACTORY
// =============================================================================

export {
  createMeltTabs,
  type MeltTabsInstance,
  type MeltTabsConfig,
} from "./factory.js";

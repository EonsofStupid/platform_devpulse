/**
 * @file Primitives Barrel
 * @description Exports all primitive contracts from taxonomy/kinds/primitives/
 *
 * NOTE: This is for convenience. The scanner reads folders directly.
 * Adding a new primitive folder is what matters - this file is optional.
 */

// Dialog (MeltUI)
export {
  contract as dialogContract,
  dialogSlots,
  dialogStateTokens,
  dialogSlotStates,
  type DialogSlot,
  type DialogState,
} from "./dialog/index.js";

// Button (ColdLight custom ARIA)
export {
  contract as buttonContract,
  buttonSlots,
  buttonStateTokens,
  buttonSlotStates,
  type ButtonSlot,
  type ButtonState,
} from "./button/index.js";

// Tabs (MeltUI)
export {
  contract as tabsContract,
  tabsSlots,
  tabsStateTokens,
  tabsSlotStates,
  type TabsSlot,
  type TabsState,
} from "./tabs/index.js";

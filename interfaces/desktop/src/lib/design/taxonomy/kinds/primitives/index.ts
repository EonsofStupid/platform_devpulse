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

// Sheet (MeltUI)
export {
  contract as sheetContract,
  sheetSlots,
  sheetStateTokens,
  sheetSlotStates,
  type SheetSlot,
  type SheetState,
} from "./sheet/index.js";

// AlertDialog (MeltUI)
export {
  contract as alertDialogContract,
  alertDialogSlots,
  alertDialogStateTokens,
  alertDialogSlotStates,
  type AlertDialogSlot,
  type AlertDialogState,
} from "./alert-dialog/index.js";

// Popover (MeltUI)
export {
  contract as popoverContract,
  popoverSlots,
  popoverStateTokens,
  popoverSlotStates,
  type PopoverSlot,
  type PopoverState,
} from "./popover/index.js";

// Tooltip (MeltUI)
export {
  contract as tooltipContract,
  tooltipSlots,
  tooltipStateTokens,
  tooltipSlotStates,
  type TooltipSlot,
  type TooltipState,
} from "./tooltip/index.js";

// Select (MeltUI)
export {
  contract as selectContract,
  selectSlots,
  selectStateTokens,
  selectSlotStates,
  type SelectSlot,
  type SelectState,
} from "./select/index.js";

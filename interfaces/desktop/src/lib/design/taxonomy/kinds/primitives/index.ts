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

// Separator (ColdLight)
export {
	contract as separatorContract,
	separatorSlots,
	separatorStateTokens,
	separatorSlotStates,
	type SeparatorSlot,
	type SeparatorState,
} from "./separator/index.js";

// Collapsible (ColdLight)
export {
	contract as collapsibleContract,
	collapsibleSlots,
	collapsibleStateTokens,
	collapsibleSlotStates,
	type CollapsibleSlot,
	type CollapsibleState,
} from "./collapsible/index.js";

// Accordion (ColdLight)
export {
	contract as accordionContract,
	accordionSlots,
	accordionStateTokens,
	accordionSlotStates,
	type AccordionSlot,
	type AccordionState,
} from "./accordion/index.js";

// ScrollArea (ColdLight)
export {
	contract as scrollAreaContract,
	scrollAreaSlots,
	scrollAreaStateTokens,
	scrollAreaSlotStates,
	type ScrollAreaSlot,
	type ScrollAreaState,
} from "./scroll-area/index.js";

// Toolbar (ColdLight)
export {
	contract as toolbarContract,
	toolbarSlots,
	toolbarStateTokens,
	toolbarSlotStates,
	type ToolbarSlot,
	type ToolbarState,
} from "./toolbar/index.js";

// Label (ColdLight)
export {
	contract as labelContract,
	labelSlots,
	labelStateTokens,
	labelSlotStates,
	type LabelSlot,
	type LabelState,
} from "./label/index.js";

// Badge (ColdLight)
export {
	contract as badgeContract,
	badgeSlots,
	badgeStateTokens,
	badgeSlotStates,
	type BadgeSlot,
	type BadgeState,
} from "./badge/index.js";

// Input (ColdLight)
export {
	contract as inputContract,
	inputSlots,
	inputStateTokens,
	inputSlotStates,
	type InputSlot,
	type InputState,
} from "./input/index.js";

// Textarea (ColdLight)
export {
	contract as textareaContract,
	textareaSlots,
	textareaStateTokens,
	textareaSlotStates,
	type TextareaSlot,
	type TextareaState,
} from "./textarea/index.js";

// Toggle (ColdLight)
export {
	contract as toggleContract,
	toggleSlots,
	toggleStateTokens,
	toggleSlotStates,
	type ToggleSlot,
	type ToggleState,
} from "./toggle/index.js";

// Skeleton (ColdLight)
export {
	contract as skeletonContract,
	skeletonSlots,
	skeletonStateTokens,
	skeletonSlotStates,
	type SkeletonSlot,
	type SkeletonState,
} from "./skeleton/index.js";

// Progress (ColdLight)
export {
	contract as progressContract,
	progressSlots,
	progressStateTokens,
	progressSlotStates,
	type ProgressSlot,
	type ProgressState,
} from "./progress/index.js";

// Alert (ColdLight)
export {
	contract as alertContract,
	alertSlots,
	alertStateTokens,
	alertSlotStates,
	type AlertSlot,
	type AlertState,
} from "./alert/index.js";

// Avatar (ColdLight)
export {
	contract as avatarContract,
	avatarSlots,
	avatarStateTokens,
	avatarSlotStates,
	type AvatarSlot,
	type AvatarState,
} from "./avatar/index.js";

// Card (ColdLight)
export {
	contract as cardContract,
	cardSlots,
	cardStateTokens,
	cardSlotStates,
	type CardSlot,
	type CardState,
} from "./card/index.js";

/**
 * @file Primitives Barrel
 * @description Exports all primitive contracts from taxonomy/kinds/primitives/
 *
 * NOTE: This is for convenience. The scanner reads folders directly.
 * Adding a new primitive folder is what matters - this file is optional.
 */

// Accordion (ColdLight)
export {
	type AccordionSlot,
	type AccordionState,
	accordionSlotStates,
	accordionSlots,
	accordionStateTokens,
	contract as accordionContract,
} from "./accordion/index.js";
// Alert (ColdLight)
export {
	type AlertSlot,
	type AlertState,
	alertSlotStates,
	alertSlots,
	alertStateTokens,
	contract as alertContract,
} from "./alert/index.js";
// AlertDialog (MeltUI)
export {
	type AlertDialogSlot,
	type AlertDialogState,
	alertDialogSlotStates,
	alertDialogSlots,
	alertDialogStateTokens,
	contract as alertDialogContract,
} from "./alert-dialog/index.js";
// Avatar (ColdLight)
export {
	type AvatarSlot,
	type AvatarState,
	avatarSlotStates,
	avatarSlots,
	avatarStateTokens,
	contract as avatarContract,
} from "./avatar/index.js";
// Badge (ColdLight)
export {
	type BadgeSlot,
	type BadgeState,
	badgeSlotStates,
	badgeSlots,
	badgeStateTokens,
	contract as badgeContract,
} from "./badge/index.js";
// Breadcrumb (ColdLight)
export {
	type BreadcrumbSlot,
	type BreadcrumbState,
	breadcrumbSlotStates,
	breadcrumbSlots,
	breadcrumbStateTokens,
	contract as breadcrumbContract,
} from "./breadcrumb/index.js";
// Button (ColdLight custom ARIA)
export {
	type ButtonSlot,
	type ButtonState,
	buttonSlotStates,
	buttonSlots,
	buttonStateTokens,
	contract as buttonContract,
} from "./button/index.js";
// Card (ColdLight)
export {
	type CardSlot,
	type CardState,
	cardSlotStates,
	cardSlots,
	cardStateTokens,
	contract as cardContract,
} from "./card/index.js";
// Checkbox (ColdLight)
export {
	type CheckboxSlot,
	type CheckboxState,
	checkboxSlotStates,
	checkboxSlots,
	checkboxStateTokens,
	contract as checkboxContract,
} from "./checkbox/index.js";

// Collapsible (ColdLight)
export {
	type CollapsibleSlot,
	type CollapsibleState,
	collapsibleSlotStates,
	collapsibleSlots,
	collapsibleStateTokens,
	contract as collapsibleContract,
} from "./collapsible/index.js";
// Combobox (MeltUI)
export {
	type ComboboxSlot,
	type ComboboxState,
	comboboxSlotStates,
	comboboxSlots,
	comboboxStateTokens,
	contract as comboboxContract,
} from "./combobox/index.js";
// Command (ColdLight)
export {
	type CommandSlot,
	type CommandState,
	commandSlotStates,
	commandSlots,
	commandStateTokens,
	contract as commandContract,
} from "./command/index.js";
// ContextMenu (MeltUI)
export {
	type ContextMenuSlot,
	type ContextMenuState,
	contextMenuSlotStates,
	contextMenuSlots,
	contextMenuStateTokens,
	contract as contextMenuContract,
} from "./context-menu/index.js";
// Dialog (MeltUI)
export {
	contract as dialogContract,
	type DialogSlot,
	type DialogState,
	dialogSlotStates,
	dialogSlots,
	dialogStateTokens,
} from "./dialog/index.js";
// DropdownMenu (MeltUI)
export {
	contract as dropdownMenuContract,
	type DropdownMenuSlot,
	type DropdownMenuState,
	dropdownMenuSlotStates,
	dropdownMenuSlots,
	dropdownMenuStateTokens,
} from "./dropdown-menu/index.js";
// HoverCard (MeltUI)
export {
	contract as hoverCardContract,
	type HoverCardSlot,
	type HoverCardState,
	hoverCardSlotStates,
	hoverCardSlots,
	hoverCardStateTokens,
} from "./hover-card/index.js";
// Input (ColdLight)
export {
	contract as inputContract,
	type InputSlot,
	type InputState,
	inputSlotStates,
	inputSlots,
	inputStateTokens,
} from "./input/index.js";
// Label (ColdLight)
export {
	contract as labelContract,
	type LabelSlot,
	type LabelState,
	labelSlotStates,
	labelSlots,
	labelStateTokens,
} from "./label/index.js";
// Menubar (MeltUI)
export {
	contract as menubarContract,
	type MenubarSlot,
	type MenubarState,
	menubarSlotStates,
	menubarSlots,
	menubarStateTokens,
} from "./menubar/index.js";
// NavigationMenu (ColdLight)
export {
	contract as navigationMenuContract,
	type NavigationMenuSlot,
	type NavigationMenuState,
	navigationMenuSlotStates,
	navigationMenuSlots,
	navigationMenuStateTokens,
} from "./navigation-menu/index.js";
// Pagination (MeltUI)
export {
	contract as paginationContract,
	type PaginationSlot,
	type PaginationState,
	paginationSlotStates,
	paginationSlots,
	paginationStateTokens,
} from "./pagination/index.js";
// PinInput (MeltUI)
export {
	contract as pinInputContract,
	type PinInputSlot,
	type PinInputState,
	pinInputSlotStates,
	pinInputSlots,
	pinInputStateTokens,
} from "./pin-input/index.js";
// Popover (MeltUI)
export {
	contract as popoverContract,
	type PopoverSlot,
	type PopoverState,
	popoverSlotStates,
	popoverSlots,
	popoverStateTokens,
} from "./popover/index.js";
// Progress (ColdLight)
export {
	contract as progressContract,
	type ProgressSlot,
	type ProgressState,
	progressSlotStates,
	progressSlots,
	progressStateTokens,
} from "./progress/index.js";
// RadioGroup (ColdLight)
export {
	contract as radioGroupContract,
	type RadioGroupSlot,
	type RadioGroupState,
	radioGroupSlotStates,
	radioGroupSlots,
	radioGroupStateTokens,
} from "./radio-group/index.js";
// ScrollArea (ColdLight)
export {
	contract as scrollAreaContract,
	type ScrollAreaSlot,
	type ScrollAreaState,
	scrollAreaSlotStates,
	scrollAreaSlots,
	scrollAreaStateTokens,
} from "./scroll-area/index.js";
// Select (MeltUI)
export {
	contract as selectContract,
	type SelectSlot,
	type SelectState,
	selectSlotStates,
	selectSlots,
	selectStateTokens,
} from "./select/index.js";
// Separator (ColdLight)
export {
	contract as separatorContract,
	type SeparatorSlot,
	type SeparatorState,
	separatorSlotStates,
	separatorSlots,
	separatorStateTokens,
} from "./separator/index.js";
// Sheet (MeltUI)
export {
	contract as sheetContract,
	type SheetSlot,
	type SheetState,
	sheetSlotStates,
	sheetSlots,
	sheetStateTokens,
} from "./sheet/index.js";
// Skeleton (ColdLight)
export {
	contract as skeletonContract,
	type SkeletonSlot,
	type SkeletonState,
	skeletonSlotStates,
	skeletonSlots,
	skeletonStateTokens,
} from "./skeleton/index.js";
// Slider (MeltUI)
export {
	contract as sliderContract,
	type SliderSlot,
	type SliderState,
	sliderSlotStates,
	sliderSlots,
	sliderStateTokens,
} from "./slider/index.js";
// Spinner (ColdLight)
export {
	contract as spinnerContract,
	type SpinnerSlot,
	type SpinnerState,
	spinnerSlotStates,
	spinnerSlots,
	spinnerStateTokens,
} from "./spinner/index.js";
// Switch (ColdLight)
export {
	contract as switchContract,
	type SwitchSlot,
	type SwitchState,
	switchSlotStates,
	switchSlots,
	switchStateTokens,
} from "./switch/index.js";
// Tabs (MeltUI)
export {
	contract as tabsContract,
	type TabsSlot,
	type TabsState,
	tabsSlotStates,
	tabsSlots,
	tabsStateTokens,
} from "./tabs/index.js";
// Textarea (ColdLight)
export {
	contract as textareaContract,
	type TextareaSlot,
	type TextareaState,
	textareaSlotStates,
	textareaSlots,
	textareaStateTokens,
} from "./textarea/index.js";
// Toggle (ColdLight)
export {
	contract as toggleContract,
	type ToggleSlot,
	type ToggleState,
	toggleSlotStates,
	toggleSlots,
	toggleStateTokens,
} from "./toggle/index.js";
// ToggleGroup (MeltUI)
export {
	contract as toggleGroupContract,
	type ToggleGroupSlot,
	type ToggleGroupState,
	toggleGroupSlotStates,
	toggleGroupSlots,
	toggleGroupStateTokens,
} from "./toggle-group/index.js";
// Toolbar (ColdLight)
export {
	contract as toolbarContract,
	type ToolbarSlot,
	type ToolbarState,
	toolbarSlotStates,
	toolbarSlots,
	toolbarStateTokens,
} from "./toolbar/index.js";
// Tooltip (MeltUI)
export {
	contract as tooltipContract,
	type TooltipSlot,
	type TooltipState,
	tooltipSlotStates,
	tooltipSlots,
	tooltipStateTokens,
} from "./tooltip/index.js";
// VisuallyHidden (ColdLight utility)
export {
	contract as visuallyHiddenContract,
	type VisuallyHiddenSlot,
	type VisuallyHiddenState,
	visuallyHiddenSlotStates,
	visuallyHiddenSlots,
	visuallyHiddenStateTokens,
} from "./visually-hidden/index.js";

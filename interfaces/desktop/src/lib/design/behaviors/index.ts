/**
 * @file primitives/index.ts — Root barrel for all ColdLight primitives.
 *
 * Primitives are behavioral hooks: ARIA, keyboard, state management.
 * They are the foundation that components are built from.
 *
 * Layout utilities (box, flex, grid, stack, etc.) live in utils/, not here.
 */

export type { AccordionType, UseAccordionProps, UseAccordionReturn } from "./accordion/index.js";
// ── Interactive Components ──────────────────────────────────────
export { accordionAnatomy, useAccordion } from "./accordion/index.js";
export type { UseAlertDialogProps, UseAlertDialogReturn } from "./alert-dialog/index.js";
export { alertDialogAnatomy, useAlertDialog } from "./alert-dialog/index.js";
export type { UseBreadcrumbsProps, UseBreadcrumbsReturn } from "./breadcrumbs/index.js";
export { breadcrumbsAnatomy, useBreadcrumbs } from "./breadcrumbs/index.js";
export type { ButtonType, UseButtonProps, UseButtonReturn } from "./button/index.js";
export { buttonAnatomy, useButton } from "./button/index.js";
export type { CheckboxState, UseCheckboxProps, UseCheckboxReturn } from "./checkbox/index.js";
export { checkboxAnatomy, useCheckbox } from "./checkbox/index.js";
export type { UseColorFieldProps, UseColorFieldReturn } from "./color-field/index.js";
export { colorFieldAnatomy, useColorField } from "./color-field/index.js";
export type { UseColorSliderProps, UseColorSliderReturn } from "./color-slider/index.js";
export { colorSliderAnatomy, useColorSlider } from "./color-slider/index.js";
export type { UseComboBoxProps, UseComboBoxReturn } from "./combobox/index.js";
export { comboboxAnatomy, useComboBox } from "./combobox/index.js";
export type { UseDialogProps, UseDialogReturn } from "./dialog/index.js";
export { dialogAnatomy, useDialog } from "./dialog/index.js";
export type { UseFieldProps, UseFieldReturn } from "./field/index.js";
export { fieldAnatomy, useField } from "./field/index.js";
export type { UseFocusProps, UseFocusReturn } from "./focus/index.js";
// ── Interaction Utilities (composable by other primitives) ──────
export { useFocus } from "./focus/index.js";
export type { UseFocusRingProps, UseFocusRingReturn } from "./focus-ring/index.js";
export { useFocusRing } from "./focus-ring/index.js";
export type { UseFocusWithinProps, UseFocusWithinReturn } from "./focus-within/index.js";
export { useFocusWithin } from "./focus-within/index.js";
export type { UseGridListProps, UseGridListReturn } from "./grid-list/index.js";
export { gridListAnatomy, useGridList } from "./grid-list/index.js";
export type { UseHoverProps, UseHoverReturn } from "./hover/index.js";
export { useHover } from "./hover/index.js";
export type { UseLabelProps, UseLabelReturn } from "./label/index.js";
export { labelAnatomy, useLabel } from "./label/index.js";
export type { UseLinkProps, UseLinkReturn } from "./link/index.js";
export { linkAnatomy, useLink } from "./link/index.js";
export type { UseListBoxProps, UseListBoxReturn } from "./listbox/index.js";
export { listboxAnatomy, useListBox } from "./listbox/index.js";
export type { UseLocaleProps, UseLocaleReturn } from "./locale/index.js";
export { useLocale } from "./locale/index.js";
export type { UseLongPressProps, UseLongPressReturn } from "./long-press/index.js";
export { useLongPress } from "./long-press/index.js";
export type { UseMenuProps, UseMenuReturn } from "./menu/index.js";
export { menuAnatomy, useMenu } from "./menu/index.js";
export type { UseMeterProps, UseMeterReturn } from "./meter/index.js";
export { meterAnatomy, useMeter } from "./meter/index.js";
export type { UseMoveProps, UseMoveReturn } from "./move/index.js";
export { useMove } from "./move/index.js";
export type { UseNumberFieldProps, UseNumberFieldReturn } from "./number-field/index.js";
export { numberFieldAnatomy, useNumberField } from "./number-field/index.js";
export type { UsePopoverProps, UsePopoverReturn } from "./popover/index.js";
export { popoverAnatomy, usePopover } from "./popover/index.js";
export type { UsePressProps, UsePressReturn } from "./press/index.js";
export { usePress } from "./press/index.js";
export type { UseProgressProps, UseProgressReturn } from "./progress/index.js";
export { progressAnatomy, useProgress } from "./progress/index.js";
export type { UseRadioGroupProps, UseRadioGroupReturn } from "./radio-group/index.js";
export { radioGroupAnatomy, useRadioGroup } from "./radio-group/index.js";
export type { UseSearchFieldProps, UseSearchFieldReturn } from "./search-field/index.js";
export { searchFieldAnatomy, useSearchField } from "./search-field/index.js";
export type { UseSelectProps, UseSelectReturn } from "./select/index.js";
export { selectAnatomy, useSelect } from "./select/index.js";
export type { UseSeparatorProps, UseSeparatorReturn } from "./separator/index.js";
export { separatorAnatomy, useSeparator } from "./separator/index.js";
export type { UseSheetProps, UseSheetReturn } from "./sheet/index.js";
export { sheetAnatomy, useSheet } from "./sheet/index.js";
export type { UseSliderProps, UseSliderReturn } from "./slider/index.js";
export { sliderAnatomy, useSlider } from "./slider/index.js";
export type { UseSwitchProps, UseSwitchReturn } from "./switch/index.js";
export { switchAnatomy, useSwitch } from "./switch/index.js";
export type { UseTableProps, UseTableReturn } from "./table/index.js";
export { tableAnatomy, useTable } from "./table/index.js";
export type { UseTabsProps, UseTabsReturn } from "./tabs/index.js";
export { tabsAnatomy, useTabs } from "./tabs/index.js";
export type { UseTagGroupProps, UseTagGroupReturn } from "./tag-group/index.js";
export { tagGroupAnatomy, useTagGroup } from "./tag-group/index.js";
export type { UseTextFieldProps, UseTextFieldReturn } from "./text-field/index.js";
export { textFieldAnatomy, useTextField } from "./text-field/index.js";
export type { UseToggleProps, UseToggleReturn } from "./toggle/index.js";
export { toggleAnatomy, useToggle } from "./toggle/index.js";
export type { UseToolbarProps, UseToolbarReturn } from "./toolbar/index.js";
export { toolbarAnatomy, useToolbar } from "./toolbar/index.js";
export type { UseTooltipProps, UseTooltipReturn } from "./tooltip/index.js";
export { tooltipAnatomy, useTooltip } from "./tooltip/index.js";
export type { UseTreeProps, UseTreeReturn } from "./tree/index.js";
export { treeAnatomy, useTree } from "./tree/index.js";

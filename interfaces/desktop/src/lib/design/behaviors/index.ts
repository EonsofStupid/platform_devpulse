/**
 * @file primitives/index.ts — Root barrel for all ColdLight primitives.
 *
 * Primitives are behavioral hooks: ARIA, keyboard, state management.
 * They are the foundation that components are built from.
 *
 * Layout utilities (box, flex, grid, stack, etc.) live in utils/, not here.
 */

// ── Interactive Components ──────────────────────────────────────
export { useAccordion, accordionAnatomy } from "./accordion/index.js";
export type { AccordionType, UseAccordionProps, UseAccordionReturn } from "./accordion/index.js";

export { useAlertDialog, alertDialogAnatomy } from "./alert-dialog/index.js";
export type { UseAlertDialogProps, UseAlertDialogReturn } from "./alert-dialog/index.js";

export { useBreadcrumbs, breadcrumbsAnatomy } from "./breadcrumbs/index.js";
export type { UseBreadcrumbsProps, UseBreadcrumbsReturn } from "./breadcrumbs/index.js";

export { useButton, buttonAnatomy } from "./button/index.js";
export type { ButtonType, UseButtonProps, UseButtonReturn } from "./button/index.js";

export { useCheckbox, checkboxAnatomy } from "./checkbox/index.js";
export type { CheckboxState, UseCheckboxProps, UseCheckboxReturn } from "./checkbox/index.js";

export { useColorField, colorFieldAnatomy } from "./color-field/index.js";
export type { UseColorFieldProps, UseColorFieldReturn } from "./color-field/index.js";

export { useColorSlider, colorSliderAnatomy } from "./color-slider/index.js";
export type { UseColorSliderProps, UseColorSliderReturn } from "./color-slider/index.js";

export { useComboBox, comboboxAnatomy } from "./combobox/index.js";
export type { UseComboBoxProps, UseComboBoxReturn } from "./combobox/index.js";

export { useDialog, dialogAnatomy } from "./dialog/index.js";
export type { UseDialogProps, UseDialogReturn } from "./dialog/index.js";

export { useField, fieldAnatomy } from "./field/index.js";
export type { UseFieldProps, UseFieldReturn } from "./field/index.js";

export { useGridList, gridListAnatomy } from "./grid-list/index.js";
export type { UseGridListProps, UseGridListReturn } from "./grid-list/index.js";

export { useLink, linkAnatomy } from "./link/index.js";
export type { UseLinkProps, UseLinkReturn } from "./link/index.js";

export { useListBox, listboxAnatomy } from "./listbox/index.js";
export type { UseListBoxProps, UseListBoxReturn } from "./listbox/index.js";

export { useMenu, menuAnatomy } from "./menu/index.js";
export type { UseMenuProps, UseMenuReturn } from "./menu/index.js";

export { useMeter, meterAnatomy } from "./meter/index.js";
export type { UseMeterProps, UseMeterReturn } from "./meter/index.js";

export { useNumberField, numberFieldAnatomy } from "./number-field/index.js";
export type { UseNumberFieldProps, UseNumberFieldReturn } from "./number-field/index.js";

export { usePopover, popoverAnatomy } from "./popover/index.js";
export type { UsePopoverProps, UsePopoverReturn } from "./popover/index.js";

export { useProgress, progressAnatomy } from "./progress/index.js";
export type { UseProgressProps, UseProgressReturn } from "./progress/index.js";

export { useRadioGroup, radioGroupAnatomy } from "./radio-group/index.js";
export type { UseRadioGroupProps, UseRadioGroupReturn } from "./radio-group/index.js";

export { useSearchField, searchFieldAnatomy } from "./search-field/index.js";
export type { UseSearchFieldProps, UseSearchFieldReturn } from "./search-field/index.js";

export { useSelect, selectAnatomy } from "./select/index.js";
export type { UseSelectProps, UseSelectReturn } from "./select/index.js";

export { useSeparator, separatorAnatomy } from "./separator/index.js";
export type { UseSeparatorProps, UseSeparatorReturn } from "./separator/index.js";

export { useSheet, sheetAnatomy } from "./sheet/index.js";
export type { UseSheetProps, UseSheetReturn } from "./sheet/index.js";

export { useSlider, sliderAnatomy } from "./slider/index.js";
export type { UseSliderProps, UseSliderReturn } from "./slider/index.js";

export { useSwitch, switchAnatomy } from "./switch/index.js";
export type { UseSwitchProps, UseSwitchReturn } from "./switch/index.js";

export { useTable, tableAnatomy } from "./table/index.js";
export type { UseTableProps, UseTableReturn } from "./table/index.js";

export { useTabs, tabsAnatomy } from "./tabs/index.js";
export type { UseTabsProps, UseTabsReturn } from "./tabs/index.js";

export { useTagGroup, tagGroupAnatomy } from "./tag-group/index.js";
export type { UseTagGroupProps, UseTagGroupReturn } from "./tag-group/index.js";

export { useTextField, textFieldAnatomy } from "./text-field/index.js";
export type { UseTextFieldProps, UseTextFieldReturn } from "./text-field/index.js";

export { useToggle, toggleAnatomy } from "./toggle/index.js";
export type { UseToggleProps, UseToggleReturn } from "./toggle/index.js";

export { useToolbar, toolbarAnatomy } from "./toolbar/index.js";
export type { UseToolbarProps, UseToolbarReturn } from "./toolbar/index.js";

export { useTooltip, tooltipAnatomy } from "./tooltip/index.js";
export type { UseTooltipProps, UseTooltipReturn } from "./tooltip/index.js";

export { useTree, treeAnatomy } from "./tree/index.js";
export type { UseTreeProps, UseTreeReturn } from "./tree/index.js";

// ── Interaction Utilities (composable by other primitives) ──────
export { useFocus } from "./focus/index.js";
export type { UseFocusProps, UseFocusReturn } from "./focus/index.js";

export { useFocusRing } from "./focus-ring/index.js";
export type { UseFocusRingProps, UseFocusRingReturn } from "./focus-ring/index.js";

export { useFocusWithin } from "./focus-within/index.js";
export type { UseFocusWithinProps, UseFocusWithinReturn } from "./focus-within/index.js";

export { useHover } from "./hover/index.js";
export type { UseHoverProps, UseHoverReturn } from "./hover/index.js";

export { useLongPress } from "./long-press/index.js";
export type { UseLongPressProps, UseLongPressReturn } from "./long-press/index.js";

export { useMove } from "./move/index.js";
export type { UseMoveProps, UseMoveReturn } from "./move/index.js";

export { usePress } from "./press/index.js";
export type { UsePressProps, UsePressReturn } from "./press/index.js";

export { useLabel, labelAnatomy } from "./label/index.js";
export type { UseLabelProps, UseLabelReturn } from "./label/index.js";

export { useLocale } from "./locale/index.js";
export type { UseLocaleProps, UseLocaleReturn } from "./locale/index.js";

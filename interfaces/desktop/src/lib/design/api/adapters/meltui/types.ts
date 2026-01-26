/**
 * @file sys/api/_internal/melt/types.ts
 * @layer internal
 *
 * Melt UI builder return type aliases.
 * These are the EXACT types from @melt-ui/svelte.
 */

import type {
  createDialog,
  createPopover,
  createTooltip,
  createSelect,
  createCombobox,
  createTabs,
  createAccordion,
  createDropdownMenu,
  createContextMenu,
  createCheckbox,
  createSwitch,
  createRadioGroup,
  createCollapsible,
  createSeparator,
  createProgress,
  createToggle,
  createToggleGroup,
  createSlider,
  createLabel,
  createPagination,
  createToaster,
  createCalendar,
  createDateField,
  createDatePicker,
  createAvatar,
  createPinInput,
  createTagsInput,
  createLinkPreview,
  createMenubar,
  createScrollArea,
  createTreeView,
} from '@melt-ui/svelte';

// ============================================
// BUILDER RETURN TYPE ALIASES
// ============================================

// Overlay / Floating
export type DialogBuilder = ReturnType<typeof createDialog>;
export type PopoverBuilder = ReturnType<typeof createPopover>;
export type TooltipBuilder = ReturnType<typeof createTooltip>;
export type LinkPreviewBuilder = ReturnType<typeof createLinkPreview>;
export type ToasterBuilder = ReturnType<typeof createToaster>;

// Selection
export type SelectBuilder = ReturnType<typeof createSelect>;
export type ComboboxBuilder = ReturnType<typeof createCombobox>;
export type CheckboxBuilder = ReturnType<typeof createCheckbox>;
export type SwitchBuilder = ReturnType<typeof createSwitch>;
export type RadioGroupBuilder = ReturnType<typeof createRadioGroup>;
export type ToggleBuilder = ReturnType<typeof createToggle>;
export type ToggleGroupBuilder = ReturnType<typeof createToggleGroup>;

// Navigation
export type TabsBuilder = ReturnType<typeof createTabs>;
export type AccordionBuilder = ReturnType<typeof createAccordion>;
export type DropdownMenuBuilder = ReturnType<typeof createDropdownMenu>;
export type ContextMenuBuilder = ReturnType<typeof createContextMenu>;
export type MenubarBuilder = ReturnType<typeof createMenubar>;
export type PaginationBuilder = ReturnType<typeof createPagination>;

// Form Inputs
export type PinInputBuilder = ReturnType<typeof createPinInput>;
export type TagsInputBuilder = ReturnType<typeof createTagsInput>;
export type SliderBuilder = ReturnType<typeof createSlider>;
export type LabelBuilder = ReturnType<typeof createLabel>;

// Date/Time
export type CalendarBuilder = ReturnType<typeof createCalendar>;
export type DateFieldBuilder = ReturnType<typeof createDateField>;
export type DatePickerBuilder = ReturnType<typeof createDatePicker>;

// Layout / Display
export type CollapsibleBuilder = ReturnType<typeof createCollapsible>;
export type SeparatorBuilder = ReturnType<typeof createSeparator>;
export type ProgressBuilder = ReturnType<typeof createProgress>;
export type AvatarBuilder = ReturnType<typeof createAvatar>;
export type ScrollAreaBuilder = ReturnType<typeof createScrollArea>;

// Tree / Hierarchy
export type TreeViewBuilder = ReturnType<typeof createTreeView>;

// ============================================
// TYPE EXTRACTION UTILITIES
// ============================================

/** Extract elements from a builder. */
export type BuilderElements<T> = T extends { elements: infer E } ? E : never;

/** Extract states from a builder. */
export type BuilderStates<T> = T extends { states: infer S } ? S : never;

/** Extract helpers from a builder. */
export type BuilderHelpers<T> = T extends { helpers: infer H } ? H : never;

/** Extract options from a builder. */
export type BuilderOptions<T> = T extends { options: infer O } ? O : never;

/**
 * @file sys/api/_internal/index.ts
 * @layer internal
 *
 * Internal API barrel.
 */

// Melt UI integration
export * from './melt/index.js';

// Re-export Melt creators for convenience
export {
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

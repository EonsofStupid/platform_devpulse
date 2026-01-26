/**
 * @file taxonomy/primitiveRegistry.ts
 * @layer taxonomy
 *
 * Registry mapping primitive kinds to their implementations.
 * Enforces that every primitive is registered and provides metadata.
 */

import type { PrimitiveKind } from "./primitives/primitiveKind";

// ============================================
// PRIMITIVE SLOT DEFINITIONS
// ============================================

/**
 * Slot definitions for primitives with multiple parts.
 * Maps primitive kind to its typed slot names.
 */
export const PrimitiveSlots = {
  // Single-part primitives (root only)
  button: ["root"] as const,
  toggle: ["root"] as const,
  switch: ["root", "thumb"] as const,
  checkbox: ["root", "indicator"] as const,
  label: ["root"] as const,
  input: ["root"] as const,
  textarea: ["root"] as const,
  slider: ["root", "track", "range", "thumb"] as const,
  progress: ["root", "indicator"] as const,
  separator: ["root"] as const,
  badge: ["root"] as const,
  kbd: ["root"] as const,
  skeleton: ["root"] as const,
  spinner: ["root"] as const,
  avatar: ["root", "image", "fallback"] as const,
  aspectRatio: ["root"] as const,

  // Multi-part primitives
  toggleGroup: ["root", "item"] as const,
  radioGroup: ["root", "item", "indicator"] as const,

  select: ["root", "trigger", "value", "content", "viewport", "item", "label", "separator"] as const,
  combobox: ["root", "input", "trigger", "content", "item", "empty"] as const,
  command: ["root", "input", "list", "empty", "group", "item", "separator"] as const,

  calendar: ["root", "header", "heading", "grid", "cell", "day"] as const,
  dateField: ["root", "label", "input", "segment"] as const,
  datePicker: ["root", "trigger", "content", "calendar"] as const,
  timeField: ["root", "label", "input", "segment"] as const,

  dialog: ["root", "trigger", "portal", "overlay", "content", "header", "title", "description", "footer", "close"] as const,
  alertDialog: ["root", "trigger", "portal", "overlay", "content", "header", "title", "description", "footer", "cancel", "action"] as const,
  popover: ["root", "trigger", "content", "arrow", "close"] as const,
  hoverCard: ["root", "trigger", "content", "arrow"] as const,
  tooltip: ["root", "trigger", "content", "arrow"] as const,
  contextMenu: ["root", "trigger", "content", "item", "separator", "sub", "subTrigger", "subContent"] as const,
  dropdownMenu: ["root", "trigger", "content", "item", "separator", "sub", "subTrigger", "subContent", "checkboxItem", "radioGroup", "radioItem"] as const,

  tabs: ["root", "list", "trigger", "content"] as const,
  accordion: ["root", "item", "trigger", "content"] as const,
  collapsible: ["root", "trigger", "content"] as const,
  navigationMenu: ["root", "list", "item", "trigger", "content", "link", "indicator", "viewport"] as const,
  menubar: ["root", "menu", "trigger", "content", "item", "separator", "sub", "subTrigger", "subContent"] as const,
  pagination: ["root", "list", "item", "prev", "next", "ellipsis"] as const,
  breadcrumb: ["root", "list", "item", "link", "separator", "page"] as const,

  scrollArea: ["root", "viewport", "scrollbar", "thumb"] as const,

  toast: ["root", "title", "description", "action", "close"] as const,
  alert: ["root", "title", "description"] as const,

  portal: ["root"] as const,
  presence: ["root"] as const,
  focusTrap: ["root"] as const,
  visuallyHidden: ["root"] as const,
  liveStatus: ["root"] as const,

  dataTable: ["root", "header", "body", "row", "cell", "headerCell"] as const,
  chart: ["root", "canvas", "legend", "tooltip"] as const,
} as const satisfies Record<PrimitiveKind, readonly string[]>;

export type PrimitiveSlotsMap = typeof PrimitiveSlots;
export type SlotsFor<K extends PrimitiveKind> = PrimitiveSlotsMap[K][number];

// ============================================
// PRIMITIVE METADATA
// ============================================

export interface PrimitiveMetadata {
  /** Human-readable description */
  description: string;
  /** Melt UI builder function name */
  meltBuilder?: string;
  /** Whether this primitive is custom (not wrapping Melt UI) */
  isCustom?: boolean;
  /** ARIA role for the root element (provided by Melt UI) */
  ariaRole?: string;
  /** Whether this primitive manages focus (handled by Melt UI) */
  managesFocus?: boolean;
  /** Whether this primitive supports controlled/uncontrolled modes */
  supportsControlled?: boolean;
}

export const PrimitiveMetadata: Record<PrimitiveKind, PrimitiveMetadata> = {
  // Buttons & Toggles
  button: { description: "Interactive button element", isCustom: true, ariaRole: "button", managesFocus: true },
  toggle: { description: "Two-state toggle button", meltBuilder: "createToggle", ariaRole: "button", supportsControlled: true },
  toggleGroup: { description: "Group of toggle buttons", meltBuilder: "createToggleGroup", ariaRole: "group" },
  switch: { description: "On/off switch control", meltBuilder: "createSwitch", ariaRole: "switch", supportsControlled: true },

  // Inputs & Forms
  checkbox: { description: "Checkbox input", meltBuilder: "createCheckbox", ariaRole: "checkbox", supportsControlled: true },
  radioGroup: { description: "Radio button group", meltBuilder: "createRadioGroup", ariaRole: "radiogroup", supportsControlled: true },
  slider: { description: "Numeric slider input", meltBuilder: "createSlider", ariaRole: "slider", supportsControlled: true },
  label: { description: "Form label element", meltBuilder: "createLabel", ariaRole: "label" },
  input: { description: "Text input field", isCustom: true, ariaRole: "textbox" },
  textarea: { description: "Multi-line text input", isCustom: true, ariaRole: "textbox" },
  select: { description: "Select dropdown", meltBuilder: "createSelect", ariaRole: "listbox", supportsControlled: true, managesFocus: true },
  combobox: { description: "Autocomplete input", meltBuilder: "createCombobox", ariaRole: "combobox", supportsControlled: true, managesFocus: true },

  // Date & Time
  calendar: { description: "Calendar date picker", meltBuilder: "createCalendar", ariaRole: "grid", managesFocus: true },
  dateField: { description: "Date input field", meltBuilder: "createDateField", supportsControlled: true },
  datePicker: { description: "Date picker with calendar", meltBuilder: "createDatePicker", supportsControlled: true, managesFocus: true },
  timeField: { description: "Time input field", isCustom: true, supportsControlled: true },

  // Dialogs & Overlays
  dialog: { description: "Modal dialog", meltBuilder: "createDialog", ariaRole: "dialog", managesFocus: true, supportsControlled: true },
  alertDialog: { description: "Alert dialog requiring action", meltBuilder: "createDialog", ariaRole: "alertdialog", managesFocus: true, supportsControlled: true },
  popover: { description: "Popover overlay", meltBuilder: "createPopover", managesFocus: true, supportsControlled: true },
  hoverCard: { description: "Hover-triggered card", meltBuilder: "createLinkPreview", supportsControlled: true },
  tooltip: { description: "Tooltip overlay", meltBuilder: "createTooltip", ariaRole: "tooltip", supportsControlled: true },
  contextMenu: { description: "Right-click context menu", meltBuilder: "createContextMenu", ariaRole: "menu", managesFocus: true },
  dropdownMenu: { description: "Dropdown menu", meltBuilder: "createDropdownMenu", ariaRole: "menu", managesFocus: true },

  // Navigation
  tabs: { description: "Tabbed interface", meltBuilder: "createTabs", ariaRole: "tablist", managesFocus: true, supportsControlled: true },
  accordion: { description: "Expandable accordion", meltBuilder: "createAccordion", managesFocus: true, supportsControlled: true },
  collapsible: { description: "Collapsible content", meltBuilder: "createCollapsible", supportsControlled: true },
  navigationMenu: { description: "Navigation menu", isCustom: true, ariaRole: "navigation", managesFocus: true },
  menubar: { description: "Horizontal menu bar", meltBuilder: "createMenubar", ariaRole: "menubar", managesFocus: true },
  pagination: { description: "Pagination controls", meltBuilder: "createPagination", ariaRole: "navigation" },
  breadcrumb: { description: "Breadcrumb navigation", isCustom: true, ariaRole: "navigation" },

  // Layout & Display
  aspectRatio: { description: "Aspect ratio container", isCustom: true },
  avatar: { description: "User avatar display", meltBuilder: "createAvatar", ariaRole: "img" },
  separator: { description: "Visual separator", meltBuilder: "createSeparator", ariaRole: "separator" },
  scrollArea: { description: "Custom scrollable area", meltBuilder: "createScrollArea" },
  progress: { description: "Progress indicator", meltBuilder: "createProgress", ariaRole: "progressbar" },

  // Search & Commands
  command: { description: "Command palette", isCustom: true, ariaRole: "listbox", managesFocus: true },

  // Feedback
  toast: { description: "Toast notification", meltBuilder: "createToaster", ariaRole: "status" },
  alert: { description: "Inline alert message", isCustom: true, ariaRole: "alert" },
  badge: { description: "Status badge", isCustom: true },
  skeleton: { description: "Loading skeleton", isCustom: true },
  spinner: { description: "Loading spinner", isCustom: true, ariaRole: "status" },

  // Utilities
  portal: { description: "Portal for rendering outside DOM hierarchy", isCustom: true },
  presence: { description: "Presence animation wrapper", isCustom: true },
  focusTrap: { description: "Focus trap container", isCustom: true, managesFocus: true },
  visuallyHidden: { description: "Screen reader only content", isCustom: true },
  liveStatus: { description: "ARIA live region", isCustom: true, ariaRole: "status" },
  kbd: { description: "Keyboard shortcut display", isCustom: true },

  // Data Display
  dataTable: { description: "Data table with sorting/filtering", isCustom: true, ariaRole: "table" },
  chart: { description: "Data visualization chart", isCustom: true, ariaRole: "img" },
};

// ============================================
// REGISTRY HELPERS
// ============================================

/**
 * Get slot names for a primitive kind.
 */
export function getPrimitiveSlots<K extends PrimitiveKind>(kind: K): readonly string[] {
  return PrimitiveSlots[kind];
}

/**
 * Get metadata for a primitive kind.
 */
export function getPrimitiveMetadata(kind: PrimitiveKind): PrimitiveMetadata {
  return PrimitiveMetadata[kind];
}

/**
 * Check if a slot is valid for a primitive kind.
 */
export function isValidSlot(kind: PrimitiveKind, slot: string): boolean {
  return (PrimitiveSlots[kind] as readonly string[]).includes(slot);
}

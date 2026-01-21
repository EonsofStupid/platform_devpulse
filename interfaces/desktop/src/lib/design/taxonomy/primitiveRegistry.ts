/**
 * @file taxonomy/primitiveRegistry.ts
 * @layer taxonomy
 *
 * Registry mapping primitive kinds to their implementations.
 * Enforces that every primitive is registered and provides metadata.
 */

import type { PrimitiveKind } from "./primitiveKinds";

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
  /** Bits UI source component (if wrapping Bits UI) */
  bitsUiSource?: string;
  /** Whether this primitive is custom (not wrapping Bits UI) */
  isCustom?: boolean;
  /** ARIA role for the root element */
  ariaRole?: string;
  /** Whether this primitive manages focus */
  managesFocus?: boolean;
  /** Whether this primitive supports controlled/uncontrolled modes */
  supportsControlled?: boolean;
}

export const PrimitiveMetadata: Record<PrimitiveKind, PrimitiveMetadata> = {
  // Buttons & Toggles
  button: { description: "Interactive button element", bitsUiSource: "Button", ariaRole: "button", managesFocus: true },
  toggle: { description: "Two-state toggle button", bitsUiSource: "Toggle", ariaRole: "button", supportsControlled: true },
  toggleGroup: { description: "Group of toggle buttons", bitsUiSource: "ToggleGroup", ariaRole: "group" },
  switch: { description: "On/off switch control", bitsUiSource: "Switch", ariaRole: "switch", supportsControlled: true },

  // Inputs & Forms
  checkbox: { description: "Checkbox input", bitsUiSource: "Checkbox", ariaRole: "checkbox", supportsControlled: true },
  radioGroup: { description: "Radio button group", bitsUiSource: "RadioGroup", ariaRole: "radiogroup", supportsControlled: true },
  slider: { description: "Numeric slider input", bitsUiSource: "Slider", ariaRole: "slider", supportsControlled: true },
  label: { description: "Form label element", bitsUiSource: "Label", ariaRole: "label" },
  input: { description: "Text input field", isCustom: true, ariaRole: "textbox" },
  textarea: { description: "Multi-line text input", isCustom: true, ariaRole: "textbox" },
  select: { description: "Select dropdown", bitsUiSource: "Select", ariaRole: "listbox", supportsControlled: true, managesFocus: true },
  combobox: { description: "Autocomplete input", bitsUiSource: "Combobox", ariaRole: "combobox", supportsControlled: true, managesFocus: true },

  // Date & Time
  calendar: { description: "Calendar date picker", bitsUiSource: "Calendar", ariaRole: "grid", managesFocus: true },
  dateField: { description: "Date input field", bitsUiSource: "DateField", supportsControlled: true },
  datePicker: { description: "Date picker with calendar", bitsUiSource: "DatePicker", supportsControlled: true, managesFocus: true },
  timeField: { description: "Time input field", bitsUiSource: "TimeField", supportsControlled: true },

  // Dialogs & Overlays
  dialog: { description: "Modal dialog", bitsUiSource: "Dialog", ariaRole: "dialog", managesFocus: true, supportsControlled: true },
  alertDialog: { description: "Alert dialog requiring action", bitsUiSource: "AlertDialog", ariaRole: "alertdialog", managesFocus: true, supportsControlled: true },
  popover: { description: "Popover overlay", bitsUiSource: "Popover", managesFocus: true, supportsControlled: true },
  hoverCard: { description: "Hover-triggered card", bitsUiSource: "HoverCard", supportsControlled: true },
  tooltip: { description: "Tooltip overlay", bitsUiSource: "Tooltip", ariaRole: "tooltip", supportsControlled: true },
  contextMenu: { description: "Right-click context menu", bitsUiSource: "ContextMenu", ariaRole: "menu", managesFocus: true },
  dropdownMenu: { description: "Dropdown menu", bitsUiSource: "DropdownMenu", ariaRole: "menu", managesFocus: true },

  // Navigation
  tabs: { description: "Tabbed interface", bitsUiSource: "Tabs", ariaRole: "tablist", managesFocus: true, supportsControlled: true },
  accordion: { description: "Expandable accordion", bitsUiSource: "Accordion", managesFocus: true, supportsControlled: true },
  collapsible: { description: "Collapsible content", bitsUiSource: "Collapsible", supportsControlled: true },
  navigationMenu: { description: "Navigation menu", bitsUiSource: "NavigationMenu", ariaRole: "navigation", managesFocus: true },
  menubar: { description: "Horizontal menu bar", bitsUiSource: "Menubar", ariaRole: "menubar", managesFocus: true },
  pagination: { description: "Pagination controls", bitsUiSource: "Pagination", ariaRole: "navigation" },
  breadcrumb: { description: "Breadcrumb navigation", isCustom: true, ariaRole: "navigation" },

  // Layout & Display
  aspectRatio: { description: "Aspect ratio container", bitsUiSource: "AspectRatio" },
  avatar: { description: "User avatar display", bitsUiSource: "Avatar", ariaRole: "img" },
  separator: { description: "Visual separator", bitsUiSource: "Separator", ariaRole: "separator" },
  scrollArea: { description: "Custom scrollable area", bitsUiSource: "ScrollArea" },
  progress: { description: "Progress indicator", bitsUiSource: "Progress", ariaRole: "progressbar" },

  // Search & Commands
  command: { description: "Command palette", bitsUiSource: "Command", ariaRole: "listbox", managesFocus: true },

  // Feedback
  toast: { description: "Toast notification", isCustom: true, ariaRole: "status" },
  alert: { description: "Inline alert message", isCustom: true, ariaRole: "alert" },
  badge: { description: "Status badge", isCustom: true },
  skeleton: { description: "Loading skeleton", isCustom: true },
  spinner: { description: "Loading spinner", isCustom: true, ariaRole: "status" },

  // Utilities
  portal: { description: "Portal for rendering outside DOM hierarchy", bitsUiSource: "Portal" },
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

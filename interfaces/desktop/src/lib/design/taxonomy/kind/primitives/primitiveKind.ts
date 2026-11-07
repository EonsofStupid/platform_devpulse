/**
 * @file taxonomy/primitiveKinds.ts
 * @layer taxonomy
 *
 * Canonical registry of all primitive kinds.
 * Single source of truth - no primitive exists without being registered here.
 */

// ============================================
// PRIMITIVE KIND REGISTRY
// ============================================

/**
 * All primitive kinds in the design system.
 * Grouped by category for organization.
 */
export const PrimitiveKinds = [
  // -----------------------------------------
  // BUTTONS & TOGGLES
  // -----------------------------------------
  "button",
  "toggle",
  "toggleGroup",
  "switch",

  // -----------------------------------------
  // INPUTS & FORMS
  // -----------------------------------------
  "checkbox",
  "radioGroup",
  "slider",
  "label",
  "input",
  "textarea",
  "select",
  "combobox",

  // -----------------------------------------
  // DATE & TIME
  // -----------------------------------------
  "calendar",
  "dateField",
  "datePicker",
  "timeField",

  // -----------------------------------------
  // DIALOGS & OVERLAYS
  // -----------------------------------------
  "dialog",
  "alertDialog",
  "popover",
  "hoverCard",
  "tooltip",
  "contextMenu",
  "dropdownMenu",

  // -----------------------------------------
  // NAVIGATION
  // -----------------------------------------
  "tabs",
  "accordion",
  "collapsible",
  "navigationMenu",
  "menubar",
  "pagination",
  "breadcrumb",

  // -----------------------------------------
  // LAYOUT & DISPLAY
  // -----------------------------------------
  "aspectRatio",
  "avatar",
  "separator",
  "scrollArea",
  "progress",

  // -----------------------------------------
  // SEARCH & COMMANDS
  // -----------------------------------------
  "command",

  // -----------------------------------------
  // FEEDBACK
  // -----------------------------------------
  "toast",
  "alert",
  "badge",
  "skeleton",
  "spinner",

  // -----------------------------------------
  // UTILITIES
  // -----------------------------------------
  "portal",
  "presence",
  "focusTrap",
  "visuallyHidden",
  "liveStatus",
  "kbd",

  // -----------------------------------------
  // DATA DISPLAY
  // -----------------------------------------
  "dataTable",
  "chart",
] as const;

export type PrimitiveKind = (typeof PrimitiveKinds)[number];

// ============================================
// PRIMITIVE CATEGORIES
// ============================================

export const PrimitiveCategories = {
  buttonsToggles: ["button", "toggle", "toggleGroup", "switch"],
  inputsForms: ["checkbox", "radioGroup", "slider", "label", "input", "textarea", "select", "combobox"],
  dateTime: ["calendar", "dateField", "datePicker", "timeField"],
  dialogsOverlays: ["dialog", "alertDialog", "popover", "hoverCard", "tooltip", "contextMenu", "dropdownMenu"],
  navigation: ["tabs", "accordion", "collapsible", "navigationMenu", "menubar", "pagination", "breadcrumb"],
  layoutDisplay: ["aspectRatio", "avatar", "separator", "scrollArea", "progress"],
  searchCommands: ["command"],
  feedback: ["toast", "alert", "badge", "skeleton", "spinner"],
  utilities: ["portal", "presence", "focusTrap", "visuallyHidden", "liveStatus", "kbd"],
  dataDisplay: ["dataTable", "chart"],
} as const;

// ============================================
// VALIDATION HELPERS
// ============================================

const primitiveKindSet = new Set<string>(PrimitiveKinds);

/**
 * Type guard to check if a string is a valid primitive kind.
 */
export function isPrimitiveKind(value: string): value is PrimitiveKind {
  return primitiveKindSet.has(value);
}

/**
 * Assert that a value is a valid primitive kind.
 * Throws in development if invalid.
 */
export function assertPrimitiveKind(value: string, context?: string): asserts value is PrimitiveKind {
  if (!isPrimitiveKind(value)) {
    throw new Error(
      `[ColdLight] Invalid primitive kind "${value}"${context ? ` in ${context}` : ""}. ` +
        `Valid kinds: ${PrimitiveKinds.join(", ")}`
    );
  }
}

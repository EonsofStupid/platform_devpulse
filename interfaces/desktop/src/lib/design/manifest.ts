/**
 * @file manifest.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Component Manifest (SSOT)
 *
 * Contract rules:
 * - ColdLight is the public SSOT API surface.
 * - Provider behavior (ARIA/state/interaction) is internal and never the public identity.
 * - Component IDs are camelCase (example: alertDialog).
 * - Dependency graphs are by ID (not by name).
 * - providerKey is REQUIRED for every entry (internal binding key).
 *
 * @author Jesse "Hades" Hall
 * @license MIT
 * @since 1.0.0
 */

import { VERSION } from "./coldlight.config";

// ============================================
// ID ENFORCEMENT
// ============================================

/**
 * ColdLight component ID format:
 * - MUST be camelCase
 * - MUST start with a lowercase letter
 * - Letters/numbers only (no underscores/dashes/spaces)
 *
 * Valid: button, dialog, alertDialog, datePicker
 * Invalid: AlertDialog, alert-dialog, alert_dialog, 1button
 */
const COMPONENT_ID_RE = /^[a-z][a-zA-Z0-9]*$/;

export type ComponentId = string & { readonly __brand: "ComponentId" };

export function isComponentId(id: string): id is ComponentId {
  return COMPONENT_ID_RE.test(id);
}

export function asComponentId(id: string): ComponentId {
  if (!isComponentId(id)) {
    throw new Error(
      `[ColdLight] Invalid component id "${id}". Must be camelCase (example: alertDialog).`,
    );
  }
  return id;
}

// ============================================
// COMPONENT STATUS
// ============================================

export const ComponentStatus = {
  experimental: "experimental",
  beta: "beta",
  stable: "stable",
  deprecated: "deprecated",
  removed: "removed",
} as const;

export type ComponentStatusType =
  (typeof ComponentStatus)[keyof typeof ComponentStatus];

// ============================================
// COMPONENT CATEGORIES
// ============================================

export const ComponentCategory = {
  primitive: "primitive",
  form: "form",
  navigation: "navigation",
  data: "data",
  feedback: "feedback",
  layout: "layout",
  overlay: "overlay",
  utility: "utility",
} as const;

export type ComponentCategoryType =
  (typeof ComponentCategory)[keyof typeof ComponentCategory];

// ============================================
// COMPONENT STRUCTURE
// ============================================

/**
 * Structure describes ColdLight’s file organization.
 * It does NOT describe the provider.
 */
export const ComponentStructure = {
  /** Single-file export (Alert.svelte) */
  monolithic: "monolithic",
  /** Foldered compound API (dialog/*, sheet/*) */
  compound: "compound",
  /**
   * Adapter-backed (provider behavior lives in sys/api/_internal/*),
   * but ColdLight remains the public identity.
   */
  adapter: "adapter",
} as const;

export type ComponentStructureType =
  (typeof ComponentStructure)[keyof typeof ComponentStructure];

// ============================================
// COMPONENT ENTRY TYPES
// ============================================

export interface BreakingChange {
  version: string;
  description: string;
  migration: string;
}

/**
 * Full component manifest entry.
 *
 * providerKey:
 * - REQUIRED for every component
 * - Used by internal adapters (_internals mapping) to bind behavior/state/ARIA
 * - Must never be treated as the public identity
 */
export interface ComponentEntry {
  /** Public component name (Button, Dialog, etc.) */
  name: string;

  /** Enforced camelCase identity (alertDialog, datePicker, etc.) */
  id: ComponentId;

  status: ComponentStatusType;
  category: ComponentCategoryType;
  structure: ComponentStructureType;

  /** Version introduced */
  since: string;

  deprecatedIn?: string;
  removedIn?: string;

  description: string;

  /** Import symbol consumers use from ColdLight exports */
  importPath: string;

  /** File path(s) relative to primitives/ (or matching your layout) */
  files: string[];

  testFile?: string;

  /**
   * Dependency graph is ALWAYS by component id.
   * This is what makes it mechanically reliable.
   */
  dependencies: ComponentId[];
  dependents: ComponentId[];

  /**
   * Internal binding key resolved by sys/api/_internal/[kind]/_internals.
   * REQUIRED for all components.
   */
  providerKey: string;

  /** ColdLight-wrapped = ColdLight SSOT wrapper exists */
  isWrapped: boolean;

  hasTests: boolean;
  testCount: number;

  hasA11yDocs: boolean;

  breakingChanges: BreakingChange[];
  migrationNotes?: string;
}

// ============================================
// MANIFEST (SSOT)
// ============================================

export const MANIFEST: readonly ComponentEntry[] = [
  // ==========================================
  // WRAPPED PRIMITIVES (ColdLight SSOT wrappers)
  // ==========================================
  {
    name: "Button",
    id: asComponentId("button"),
    status: ComponentStatus.stable,
    category: ComponentCategory.primitive,
    structure: ComponentStructure.compound,
    since: "0.1.0",
    description: "Interactive button with data attributes and state management",
    importPath: "Button",
    files: ["button/index.ts", "button/types.ts", "button/Button.svelte"],
    testFile: "button/Button.test.ts",
    dependencies: [],
    dependents: [
      asComponentId("dialog"),
      asComponentId("sheet"),
      asComponentId("alertDialog"),
    ],
    providerKey: "Button",
    isWrapped: true,
    hasTests: true,
    testCount: 19,
    hasA11yDocs: true,
    breakingChanges: [],
  },
  {
    name: "Dialog",
    id: asComponentId("dialog"),
    status: ComponentStatus.stable,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.compound,
    since: "0.1.0",
    description: "Modal dialog with focus trap, ARIA, and portal rendering",
    importPath: "Dialog",
    files: [
      "dialog/index.ts",
      "dialog/types.ts",
      "dialog/Root.svelte",
      "dialog/Trigger.svelte",
      "dialog/Portal.svelte",
      "dialog/Overlay.svelte",
      "dialog/Content.svelte",
      "dialog/Title.svelte",
      "dialog/Description.svelte",
      "dialog/Close.svelte",
    ],
    testFile: "dialog/Dialog.test.ts",
    dependencies: [asComponentId("portal")],
    dependents: [asComponentId("sheet"), asComponentId("alertDialog")],
    providerKey: "Dialog",
    isWrapped: true,
    hasTests: true,
    testCount: 28,
    hasA11yDocs: true,
    breakingChanges: [],
  },
  {
    name: "Sheet",
    id: asComponentId("sheet"),
    status: ComponentStatus.stable,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.compound,
    since: "0.1.0",
    description: "Slide-in panel from any side with Dialog semantics",
    importPath: "Sheet",
    files: [
      "sheet/index.ts",
      "sheet/types.ts",
      "sheet/Root.svelte",
      "sheet/Trigger.svelte",
      "sheet/Portal.svelte",
      "sheet/Overlay.svelte",
      "sheet/Content.svelte",
      "sheet/Title.svelte",
      "sheet/Description.svelte",
      "sheet/Close.svelte",
    ],
    testFile: "sheet/Sheet.test.ts",
    dependencies: [asComponentId("dialog"), asComponentId("portal")],
    dependents: [],
    providerKey: "Dialog",
    isWrapped: true,
    hasTests: true,
    testCount: 32,
    hasA11yDocs: true,
    breakingChanges: [],
  },

  // ==========================================
  // ADAPTER-BACKED (provider behavior is internal)
  // ==========================================
  {
    name: "Accordion",
    id: asComponentId("accordion"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Expandable accordion sections",
    importPath: "Accordion",
    files: ["Accordion.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Accordion",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "AlertDialog",
    id: asComponentId("alertDialog"),
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Alert dialog requiring user action",
    importPath: "AlertDialog",
    files: ["AlertDialog.js"],
    dependencies: [asComponentId("dialog")],
    dependents: [],
    providerKey: "AlertDialog",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "AspectRatio",
    id: asComponentId("aspectRatio"),
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Maintain aspect ratio for child content",
    importPath: "AspectRatio",
    files: ["AspectRatio.js"],
    dependencies: [],
    dependents: [],
    providerKey: "AspectRatio",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Avatar",
    id: asComponentId("avatar"),
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "User avatar with image and fallback",
    importPath: "Avatar",
    files: ["Avatar.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Avatar",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Calendar",
    id: asComponentId("calendar"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Calendar for date selection",
    importPath: "Calendar",
    files: ["Calendar.js"],
    dependencies: [],
    dependents: [asComponentId("datePicker")],
    providerKey: "Calendar",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Checkbox",
    id: asComponentId("checkbox"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Checkbox input with indeterminate support",
    importPath: "Checkbox",
    files: ["Checkbox.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Checkbox",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Collapsible",
    id: asComponentId("collapsible"),
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Collapsible content section",
    importPath: "Collapsible",
    files: ["Collapsible.js"],
    dependencies: [],
    dependents: [asComponentId("accordion")],
    providerKey: "Collapsible",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Combobox",
    id: asComponentId("combobox"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Autocomplete input with suggestions",
    importPath: "Combobox",
    files: ["Combobox.js"],
    dependencies: [asComponentId("popover")],
    dependents: [],
    providerKey: "Combobox",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Command",
    id: asComponentId("command"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Command palette with search",
    importPath: "Command",
    files: ["Command.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Command",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ContextMenu",
    id: asComponentId("contextMenu"),
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Right-click context menu",
    importPath: "ContextMenu",
    files: ["ContextMenu.js"],
    dependencies: [],
    dependents: [],
    providerKey: "ContextMenu",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DateField",
    id: asComponentId("dateField"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Segmented date input field",
    importPath: "DateField",
    files: ["DateField.js"],
    dependencies: [],
    dependents: [asComponentId("datePicker")],
    providerKey: "DateField",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DatePicker",
    id: asComponentId("datePicker"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Date picker with calendar popup",
    importPath: "DatePicker",
    files: ["DatePicker.js"],
    dependencies: [
      asComponentId("calendar"),
      asComponentId("dateField"),
      asComponentId("popover"),
    ],
    dependents: [],
    providerKey: "DatePicker",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DropdownMenu",
    id: asComponentId("dropdownMenu"),
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Dropdown menu triggered by button",
    importPath: "DropdownMenu",
    files: ["DropdownMenu.js"],
    dependencies: [],
    dependents: [],
    providerKey: "DropdownMenu",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "HoverCard",
    id: asComponentId("hoverCard"),
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Hover-triggered content card",
    importPath: "HoverCard",
    files: ["HoverCard.js"],
    dependencies: [],
    dependents: [],
    providerKey: "HoverCard",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Label",
    id: asComponentId("label"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Accessible form label",
    importPath: "Label",
    files: ["Label.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Label",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Menubar",
    id: asComponentId("menubar"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Horizontal menu bar",
    importPath: "Menubar",
    files: ["Menubar.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Menubar",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "NavigationMenu",
    id: asComponentId("navigationMenu"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Navigation menu with submenus",
    importPath: "NavigationMenu",
    files: ["NavigationMenu.js"],
    dependencies: [],
    dependents: [],
    providerKey: "NavigationMenu",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Pagination",
    id: asComponentId("pagination"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Pagination controls",
    importPath: "Pagination",
    files: ["Pagination.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Pagination",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Popover",
    id: asComponentId("popover"),
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Popover overlay with positioning",
    importPath: "Popover",
    files: ["Popover.js"],
    dependencies: [],
    dependents: [
      asComponentId("combobox"),
      asComponentId("datePicker"),
      asComponentId("select"),
    ],
    providerKey: "Popover",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Progress",
    id: asComponentId("progress"),
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Progress bar indicator",
    importPath: "Progress",
    files: ["Progress.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Progress",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "RadioGroup",
    id: asComponentId("radioGroup"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Radio button group",
    importPath: "RadioGroup",
    files: ["RadioGroup.js"],
    dependencies: [],
    dependents: [],
    providerKey: "RadioGroup",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ScrollArea",
    id: asComponentId("scrollArea"),
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Custom scrollable area",
    importPath: "ScrollArea",
    files: ["ScrollArea.js"],
    dependencies: [],
    dependents: [],
    providerKey: "ScrollArea",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Select",
    id: asComponentId("select"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Select dropdown input",
    importPath: "Select",
    files: ["Select.js"],
    dependencies: [asComponentId("popover")],
    dependents: [],
    providerKey: "Select",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Separator",
    id: asComponentId("separator"),
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Visual separator line",
    importPath: "Separator",
    files: ["Separator.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Separator",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Slider",
    id: asComponentId("slider"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Range slider input",
    importPath: "Slider",
    files: ["Slider.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Slider",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Switch",
    id: asComponentId("switch"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Toggle switch control",
    importPath: "Switch",
    files: ["Switch.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Switch",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Tabs",
    id: asComponentId("tabs"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Tabbed interface",
    importPath: "Tabs",
    files: ["Tabs.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Tabs",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "TimeField",
    id: asComponentId("timeField"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Segmented time input field",
    importPath: "TimeField",
    files: ["TimeField.js"],
    dependencies: [],
    dependents: [],
    providerKey: "TimeField",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Toggle",
    id: asComponentId("toggle"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Toggle button",
    importPath: "Toggle",
    files: ["Toggle.js"],
    dependencies: [],
    dependents: [asComponentId("toggleGroup")],
    providerKey: "Toggle",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ToggleGroup",
    id: asComponentId("toggleGroup"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Group of toggle buttons",
    importPath: "ToggleGroup",
    files: ["ToggleGroup.js"],
    dependencies: [asComponentId("toggle")],
    dependents: [],
    providerKey: "ToggleGroup",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Tooltip",
    id: asComponentId("tooltip"),
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.adapter,
    since: "0.1.0",
    description: "Tooltip overlay",
    importPath: "Tooltip",
    files: ["Tooltip.js"],
    dependencies: [],
    dependents: [],
    providerKey: "Tooltip",
    isWrapped: true,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },

  // ==========================================
  // CUSTOM PRIMITIVES (ColdLight-owned)
  // ==========================================
  {
    name: "Alert",
    id: asComponentId("alert"),
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Inline alert message",
    importPath: "Alert",
    files: ["Alert.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Alert",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Badge",
    id: asComponentId("badge"),
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Status badge",
    importPath: "Badge",
    files: ["Badge.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Badge",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Breadcrumb",
    id: asComponentId("breadcrumb"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Breadcrumb navigation with route awareness",
    importPath: "Breadcrumb",
    files: ["Breadcrumb.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Breadcrumb",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ButtonGroup",
    id: asComponentId("buttonGroup"),
    status: ComponentStatus.beta,
    category: ComponentCategory.primitive,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Group of related buttons",
    importPath: "ButtonGroup",
    files: ["ButtonGroup.svelte"],
    dependencies: [asComponentId("button")],
    dependents: [],
    providerKey: "ButtonGroup",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Card",
    id: asComponentId("card"),
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Card container",
    importPath: "Card",
    files: ["Card.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Card",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Carousel",
    id: asComponentId("carousel"),
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Carousel/slider component",
    importPath: "Carousel",
    files: ["Carousel.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Carousel",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Chart",
    id: asComponentId("chart"),
    status: ComponentStatus.experimental,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Data visualization chart",
    importPath: "Chart",
    files: ["Chart.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Chart",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DataTable",
    id: asComponentId("dataTable"),
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Data table with TanStack Table integration",
    importPath: "DataTable",
    files: ["DataTable.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "DataTable",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Empty",
    id: asComponentId("empty"),
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Empty state display",
    importPath: "Empty",
    files: ["Empty.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Empty",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Field",
    id: asComponentId("field"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Form field wrapper with label/error",
    importPath: "Field",
    files: ["Field.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Field",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "FocusTrap",
    id: asComponentId("focusTrap"),
    status: ComponentStatus.beta,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Focus trap container",
    importPath: "FocusTrap",
    files: ["FocusTrap.svelte"],
    dependencies: [],
    dependents: [asComponentId("dialog"), asComponentId("sheet")],
    providerKey: "FocusTrap",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Form",
    id: asComponentId("form"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Form wrapper with validation",
    importPath: "Form",
    files: ["Form.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Form",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputEmail",
    id: asComponentId("inputEmail"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Email input field",
    importPath: "InputEmail",
    files: ["InputEmail.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "InputEmail",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputGroup",
    id: asComponentId("inputGroup"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Input with addon/prefix/suffix",
    importPath: "InputGroup",
    files: ["InputGroup.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "InputGroup",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputNumber",
    id: asComponentId("inputNumber"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Number input field",
    importPath: "InputNumber",
    files: ["InputNumber.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "InputNumber",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputOTP",
    id: asComponentId("inputOTP"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "One-time password input",
    importPath: "InputOTP",
    files: ["InputOTP.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "InputOTP",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputPassword",
    id: asComponentId("inputPassword"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Password input with visibility toggle",
    importPath: "InputPassword",
    files: ["InputPassword.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "InputPassword",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputText",
    id: asComponentId("inputText"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Text input field",
    importPath: "InputText",
    files: ["InputText.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "InputText",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Kbd",
    id: asComponentId("kbd"),
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Keyboard shortcut display",
    importPath: "Kbd",
    files: ["Kbd.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Kbd",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "LiveStatus",
    id: asComponentId("liveStatus"),
    status: ComponentStatus.beta,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "ARIA live region for announcements",
    importPath: "LiveStatus",
    files: ["LiveStatus.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "LiveStatus",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "NavMenu",
    id: asComponentId("navMenu"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Navigation menu with route awareness",
    importPath: "NavMenu",
    files: ["NavMenu.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "NavMenu",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "NativeSelect",
    id: asComponentId("nativeSelect"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Native HTML select element",
    importPath: "NativeSelect",
    files: ["NativeSelect.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "NativeSelect",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Portal",
    id: asComponentId("portal"),
    status: ComponentStatus.stable,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Render children in a portal",
    importPath: "Portal",
    files: ["Portal.svelte"],
    dependencies: [],
    dependents: [
      asComponentId("dialog"),
      asComponentId("sheet"),
      asComponentId("popover"),
    ],
    providerKey: "Portal",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Presence",
    id: asComponentId("presence"),
    status: ComponentStatus.stable,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Presence animation wrapper",
    importPath: "Presence",
    files: ["Presence.svelte"],
    dependencies: [],
    dependents: [asComponentId("dialog"), asComponentId("sheet")],
    providerKey: "Presence",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Sidebar",
    id: asComponentId("sidebar"),
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Sidebar navigation",
    importPath: "Sidebar",
    files: ["Sidebar.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Sidebar",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Skeleton",
    id: asComponentId("skeleton"),
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Loading skeleton placeholder",
    importPath: "Skeleton",
    files: ["Skeleton.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Skeleton",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Spinner",
    id: asComponentId("spinner"),
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Loading spinner",
    importPath: "Spinner",
    files: ["Spinner.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Spinner",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Table",
    id: asComponentId("table"),
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Basic HTML table wrapper",
    importPath: "Table",
    files: ["Table.svelte"],
    dependencies: [],
    dependents: [asComponentId("dataTable")],
    providerKey: "Table",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Textarea",
    id: asComponentId("textarea"),
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Multi-line text input",
    importPath: "Textarea",
    files: ["Textarea.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Textarea",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Toast",
    id: asComponentId("toast"),
    status: ComponentStatus.stable,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Toast notification (svelte-sonner)",
    importPath: "Toast",
    files: ["Toast.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Toast",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Typography",
    id: asComponentId("typography"),
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Typography primitives (h1-h6, p, etc.)",
    importPath: "Typography",
    files: ["Typography.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "Typography",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "VisuallyHidden",
    id: asComponentId("visuallyHidden"),
    status: ComponentStatus.stable,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Screen reader only content",
    importPath: "VisuallyHidden",
    files: ["VisuallyHidden.svelte"],
    dependencies: [],
    dependents: [],
    providerKey: "VisuallyHidden",
    isWrapped: false,
    hasTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
] as const;

// ============================================
// HELPERS
// ============================================

export function getComponent(id: ComponentId): ComponentEntry | undefined {
  return MANIFEST.find((c) => c.id === id);
}

export function getComponentsByStatus(status: ComponentStatusType): ComponentEntry[] {
  return MANIFEST.filter((c) => c.status === status);
}

export function getComponentsByCategory(category: ComponentCategoryType): ComponentEntry[] {
  return MANIFEST.filter((c) => c.category === category);
}

export function getComponentsByStructure(structure: ComponentStructureType): ComponentEntry[] {
  return MANIFEST.filter((c) => c.structure === structure);
}

export function getStableComponents(): ComponentEntry[] {
  return getComponentsByStatus(ComponentStatus.stable);
}

export function getWrappedComponents(): ComponentEntry[] {
  return MANIFEST.filter((c) => c.isWrapped);
}

export function getTestedComponents(): ComponentEntry[] {
  return MANIFEST.filter((c) => c.hasTests);
}

export function getTotalTestCount(): number {
  return MANIFEST.reduce((sum, c) => sum + c.testCount, 0);
}

export function getDependencies(id: ComponentId): ComponentEntry[] {
  const component = getComponent(id);
  if (!component) return [];
  return component.dependencies
    .map((depId) => getComponent(depId))
    .filter((c): c is ComponentEntry => c !== undefined);
}

export function getDependents(id: ComponentId): ComponentEntry[] {
  const component = getComponent(id);
  if (!component) return [];
  return component.dependents
    .map((depId) => getComponent(depId))
    .filter((c): c is ComponentEntry => c !== undefined);
}

/**
 * Hard validation for tests/CI:
 * - unique ids
 * - all dependency ids exist
 * - providerKey required and non-empty
 */
export function validateManifest(manifest: readonly ComponentEntry[] = MANIFEST) {
  const ids = new Set<string>();

  for (const c of manifest) {
    if (!c.providerKey || c.providerKey.trim().length === 0) {
      throw new Error(`[ColdLight] Missing providerKey for component: ${c.id}`);
    }

    if (ids.has(c.id)) throw new Error(`[ColdLight] Duplicate component id: ${c.id}`);
    ids.add(c.id);
  }

  const exists = (id: ComponentId) => manifest.some((c) => c.id === id);

  for (const c of manifest) {
    for (const dep of c.dependencies) {
      if (!exists(dep)) {
        throw new Error(`[ColdLight] ${c.id} depends on missing component: ${dep}`);
      }
    }
    for (const dep of c.dependents) {
      if (!exists(dep)) {
        throw new Error(`[ColdLight] ${c.id} lists missing dependent component: ${dep}`);
      }
    }
  }

  return true;
}

export function getManifestStats() {
  const total = MANIFEST.length;
  const byStatus = {
    stable: getComponentsByStatus(ComponentStatus.stable).length,
    beta: getComponentsByStatus(ComponentStatus.beta).length,
    experimental: getComponentsByStatus(ComponentStatus.experimental).length,
    deprecated: getComponentsByStatus(ComponentStatus.deprecated).length,
    removed: getComponentsByStatus(ComponentStatus.removed).length,
  };
  const byStructure = {
    compound: getComponentsByStructure(ComponentStructure.compound).length,
    monolithic: getComponentsByStructure(ComponentStructure.monolithic).length,
    adapter: getComponentsByStructure(ComponentStructure.adapter).length,
  };
  const wrapped = getWrappedComponents().length;
  const tested = getTestedComponents().length;
  const totalTests = getTotalTestCount();

  return {
    total,
    byStatus,
    byStructure,
    wrapped,
    tested,
    totalTests,
    version: VERSION,
  };
}

export default MANIFEST;

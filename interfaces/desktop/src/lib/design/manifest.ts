/**
 * @file manifest.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Component Manifest
 *
 * This is the centralized registry of ALL components in ColdLight.
 * Unlike shadcn's flat JSON, this is TypeScript with:
 * - Type-safe status tracking
 * - Version history
 * - Dependency graphs
 * - Migration guides
 * - Breaking change tracking
 *
 * @author Jesse "Hades" Hall <jessay@angryvibers.com>
 * @license MIT
 * @since 1.0.0
 */

import { VERSION } from "./coldlight.config";

// ============================================
// COMPONENT STATUS
// ============================================

/**
 * Component lifecycle status.
 */
export const ComponentStatus = {
  /** In development, not ready for use */
  experimental: "experimental",
  /** Ready for use, API may change */
  beta: "beta",
  /** Stable, production-ready */
  stable: "stable",
  /** Still works but will be removed */
  deprecated: "deprecated",
  /** Removed, use migration guide */
  removed: "removed",
} as const;

export type ComponentStatusType = (typeof ComponentStatus)[keyof typeof ComponentStatus];

// ============================================
// COMPONENT CATEGORIES
// ============================================

/**
 * Component categories for organization.
 */
export const ComponentCategory = {
  /** Core primitives (Button, Dialog, etc.) */
  primitive: "primitive",
  /** Form inputs (Input, Select, etc.) */
  form: "form",
  /** Navigation (Tabs, Breadcrumb, etc.) */
  navigation: "navigation",
  /** Data display (Table, Chart, etc.) */
  data: "data",
  /** Feedback (Toast, Alert, etc.) */
  feedback: "feedback",
  /** Layout (Portal, ScrollArea, etc.) */
  layout: "layout",
  /** Overlay (Dialog, Popover, etc.) */
  overlay: "overlay",
  /** Utility (VisuallyHidden, FocusTrap, etc.) */
  utility: "utility",
} as const;

export type ComponentCategoryType = (typeof ComponentCategory)[keyof typeof ComponentCategory];

// ============================================
// COMPONENT STRUCTURE
// ============================================

/**
 * How the component is structured.
 */
export const ComponentStructure = {
  /** Single file component (Button.svelte) */
  monolithic: "monolithic",
  /** Folder with multiple slot components (dialog/) */
  compound: "compound",
  /** Re-export from bits-ui (AspectRatio.js) */
  reexport: "reexport",
} as const;

export type ComponentStructureType = (typeof ComponentStructure)[keyof typeof ComponentStructure];

// ============================================
// COMPONENT ENTRY
// ============================================

/**
 * Full component manifest entry.
 */
export interface ComponentEntry {
  /** Component name (e.g., "Button", "Dialog") */
  name: string;

  /** Lowercase identifier (e.g., "button", "dialog") */
  id: string;

  /** Current status */
  status: ComponentStatusType;

  /** Category for organization */
  category: ComponentCategoryType;

  /** File structure */
  structure: ComponentStructureType;

  /** Version this component was added */
  since: string;

  /** Version this component was deprecated (if applicable) */
  deprecatedIn?: string;

  /** Version this component was removed (if applicable) */
  removedIn?: string;

  /** Human-readable description */
  description: string;

  /** Import path from primitives index */
  importPath: string;

  /** File path(s) relative to primitives/ */
  files: string[];

  /** Test file path (if exists) */
  testFile?: string;

  /** Dependencies on other ColdLight components */
  dependencies: string[];

  /** Components that depend on this one */
  dependents: string[];

  /** Bits UI component being wrapped (if any) */
  bitsUiSource?: string;

  /** Whether this is a ColdLight-wrapped primitive (vs re-export) */
  isWrapped: boolean;

  /** Whether tests exist */
  haTests: boolean;

  /** Number of tests */
  testCount: number;

  /** Whether a11y.md documentation exists */
  hasA11yDocs: boolean;

  /** Breaking changes history */
  breakingChanges: BreakingChange[];

  /** Migration notes */
  migrationNotes?: string;
}

/**
 * Breaking change record.
 */
export interface BreakingChange {
  /** Version where change occurred */
  version: string;
  /** Description of the change */
  description: string;
  /** Migration guide */
  migration: string;
}

// ============================================
// COMPONENT MANIFEST
// ============================================

/**
 * The complete component manifest.
 * This is the SSOT for all ColdLight components.
 */
export const MANIFEST: ComponentEntry[] = [
  // ==========================================
  // WRAPPED PRIMITIVES (Compound Structure)
  // ==========================================
  {
    name: "Button",
    id: "button",
    status: ComponentStatus.stable,
    category: ComponentCategory.primitive,
    structure: ComponentStructure.compound,
    since: "0.1.0",
    description: "Interactive button with data attributes and state management",
    importPath: "Button",
    files: ["button/index.ts", "button/types.ts", "button/Button.svelte"],
    testFile: "button/Button.test.ts",
    dependencies: [],
    dependents: ["Dialog", "Sheet", "AlertDialog"],
    bitsUiSource: "Button",
    isWrapped: true,
    haTests: true,
    testCount: 19,
    hasA11yDocs: true,
    breakingChanges: [],
  },
  {
    name: "Dialog",
    id: "dialog",
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
    dependencies: ["Portal"],
    dependents: ["Sheet", "AlertDialog"],
    bitsUiSource: "Dialog",
    isWrapped: true,
    haTests: true,
    testCount: 28,
    hasA11yDocs: true,
    breakingChanges: [],
  },
  {
    name: "Sheet",
    id: "sheet",
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
    dependencies: ["Dialog", "Portal"],
    dependents: [],
    bitsUiSource: "Dialog",
    isWrapped: true,
    haTests: true,
    testCount: 32,
    hasA11yDocs: true,
    breakingChanges: [],
  },

  // ==========================================
  // BITS UI RE-EXPORTS
  // ==========================================
  {
    name: "Accordion",
    id: "accordion",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Expandable accordion sections",
    importPath: "Accordion",
    files: ["Accordion.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Accordion",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "AlertDialog",
    id: "alertDialog",
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Alert dialog requiring user action",
    importPath: "AlertDialog",
    files: ["AlertDialog.js"],
    dependencies: ["Dialog"],
    dependents: [],
    bitsUiSource: "AlertDialog",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "AspectRatio",
    id: "aspectRatio",
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Maintain aspect ratio for child content",
    importPath: "AspectRatio",
    files: ["AspectRatio.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "AspectRatio",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Avatar",
    id: "avatar",
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "User avatar with image and fallback",
    importPath: "Avatar",
    files: ["Avatar.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Avatar",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Calendar",
    id: "calendar",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Calendar for date selection",
    importPath: "Calendar",
    files: ["Calendar.js"],
    dependencies: [],
    dependents: ["DatePicker"],
    bitsUiSource: "Calendar",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Checkbox",
    id: "checkbox",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Checkbox input with indeterminate support",
    importPath: "Checkbox",
    files: ["Checkbox.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Checkbox",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Collapsible",
    id: "collapsible",
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Collapsible content section",
    importPath: "Collapsible",
    files: ["Collapsible.js"],
    dependencies: [],
    dependents: ["Accordion"],
    bitsUiSource: "Collapsible",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Combobox",
    id: "combobox",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Autocomplete input with suggestions",
    importPath: "Combobox",
    files: ["Combobox.js"],
    dependencies: ["Popover"],
    dependents: [],
    bitsUiSource: "Combobox",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Command",
    id: "command",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Command palette with search",
    importPath: "Command",
    files: ["Command.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Command",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ContextMenu",
    id: "contextMenu",
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Right-click context menu",
    importPath: "ContextMenu",
    files: ["ContextMenu.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "ContextMenu",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DateField",
    id: "dateField",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Segmented date input field",
    importPath: "DateField",
    files: ["DateField.js"],
    dependencies: [],
    dependents: ["DatePicker"],
    bitsUiSource: "DateField",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DatePicker",
    id: "datePicker",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Date picker with calendar popup",
    importPath: "DatePicker",
    files: ["DatePicker.js"],
    dependencies: ["Calendar", "DateField", "Popover"],
    dependents: [],
    bitsUiSource: "DatePicker",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DropdownMenu",
    id: "dropdownMenu",
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Dropdown menu triggered by button",
    importPath: "DropdownMenu",
    files: ["DropdownMenu.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "DropdownMenu",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "HoverCard",
    id: "hoverCard",
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Hover-triggered content card",
    importPath: "HoverCard",
    files: ["HoverCard.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "HoverCard",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Label",
    id: "label",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Accessible form label",
    importPath: "Label",
    files: ["Label.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Label",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Menubar",
    id: "menubar",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Horizontal menu bar",
    importPath: "Menubar",
    files: ["Menubar.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Menubar",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "NavigationMenu",
    id: "navigationMenu",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Navigation menu with submenus",
    importPath: "NavigationMenu",
    files: ["NavigationMenu.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "NavigationMenu",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Pagination",
    id: "pagination",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Pagination controls",
    importPath: "Pagination",
    files: ["Pagination.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Pagination",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Popover",
    id: "popover",
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Popover overlay with positioning",
    importPath: "Popover",
    files: ["Popover.js"],
    dependencies: [],
    dependents: ["Combobox", "DatePicker", "Select"],
    bitsUiSource: "Popover",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Progress",
    id: "progress",
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Progress bar indicator",
    importPath: "Progress",
    files: ["Progress.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Progress",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "RadioGroup",
    id: "radioGroup",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Radio button group",
    importPath: "RadioGroup",
    files: ["RadioGroup.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "RadioGroup",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ScrollArea",
    id: "scrollArea",
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Custom scrollable area",
    importPath: "ScrollArea",
    files: ["ScrollArea.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "ScrollArea",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Select",
    id: "select",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Select dropdown input",
    importPath: "Select",
    files: ["Select.js"],
    dependencies: ["Popover"],
    dependents: [],
    bitsUiSource: "Select",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Separator",
    id: "separator",
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Visual separator line",
    importPath: "Separator",
    files: ["Separator.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Separator",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Slider",
    id: "slider",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Range slider input",
    importPath: "Slider",
    files: ["Slider.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Slider",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Switch",
    id: "switch",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Toggle switch control",
    importPath: "Switch",
    files: ["Switch.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Switch",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Tabs",
    id: "tabs",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Tabbed interface",
    importPath: "Tabs",
    files: ["Tabs.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Tabs",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "TimeField",
    id: "timeField",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Segmented time input field",
    importPath: "TimeField",
    files: ["TimeField.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "TimeField",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Toggle",
    id: "toggle",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Toggle button",
    importPath: "Toggle",
    files: ["Toggle.js"],
    dependencies: [],
    dependents: ["ToggleGroup"],
    bitsUiSource: "Toggle",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ToggleGroup",
    id: "toggleGroup",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Group of toggle buttons",
    importPath: "ToggleGroup",
    files: ["ToggleGroup.js"],
    dependencies: ["Toggle"],
    dependents: [],
    bitsUiSource: "ToggleGroup",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Tooltip",
    id: "tooltip",
    status: ComponentStatus.beta,
    category: ComponentCategory.overlay,
    structure: ComponentStructure.reexport,
    since: "0.1.0",
    description: "Tooltip overlay",
    importPath: "Tooltip",
    files: ["Tooltip.js"],
    dependencies: [],
    dependents: [],
    bitsUiSource: "Tooltip",
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },

  // ==========================================
  // CUSTOM PRIMITIVES (Monolithic)
  // ==========================================
  {
    name: "Alert",
    id: "alert",
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Inline alert message",
    importPath: "Alert",
    files: ["Alert.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Badge",
    id: "badge",
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Status badge",
    importPath: "Badge",
    files: ["Badge.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Breadcrumb",
    id: "breadcrumb",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Breadcrumb navigation with route awareness",
    importPath: "Breadcrumb",
    files: ["Breadcrumb.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "ButtonGroup",
    id: "buttonGroup",
    status: ComponentStatus.beta,
    category: ComponentCategory.primitive,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Group of related buttons",
    importPath: "ButtonGroup",
    files: ["ButtonGroup.svelte"],
    dependencies: ["Button"],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Card",
    id: "card",
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Card container",
    importPath: "Card",
    files: ["Card.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Carousel",
    id: "carousel",
    status: ComponentStatus.beta,
    category: ComponentCategory.layout,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Carousel/slider component",
    importPath: "Carousel",
    files: ["Carousel.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Chart",
    id: "chart",
    status: ComponentStatus.experimental,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Data visualization chart",
    importPath: "Chart",
    files: ["Chart.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "DataTable",
    id: "dataTable",
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Data table with TanStack Table integration",
    importPath: "DataTable",
    files: ["DataTable.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Empty",
    id: "empty",
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Empty state display",
    importPath: "Empty",
    files: ["Empty.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Field",
    id: "field",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Form field wrapper with label/error",
    importPath: "Field",
    files: ["Field.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "FocusTrap",
    id: "focusTrap",
    status: ComponentStatus.beta,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Focus trap container",
    importPath: "FocusTrap",
    files: ["FocusTrap.svelte"],
    dependencies: [],
    dependents: ["Dialog", "Sheet"],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Form",
    id: "form",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Form wrapper with validation",
    importPath: "Form",
    files: ["Form.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputEmail",
    id: "inputEmail",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Email input field",
    importPath: "InputEmail",
    files: ["InputEmail.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputGroup",
    id: "inputGroup",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Input with addon/prefix/suffix",
    importPath: "InputGroup",
    files: ["InputGroup.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputNumber",
    id: "inputNumber",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Number input field",
    importPath: "InputNumber",
    files: ["InputNumber.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputOTP",
    id: "inputOTP",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "One-time password input",
    importPath: "InputOTP",
    files: ["InputOTP.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputPassword",
    id: "inputPassword",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Password input with visibility toggle",
    importPath: "InputPassword",
    files: ["InputPassword.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "InputText",
    id: "inputText",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Text input field",
    importPath: "InputText",
    files: ["InputText.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Kbd",
    id: "kbd",
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Keyboard shortcut display",
    importPath: "Kbd",
    files: ["Kbd.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "LiveStatus",
    id: "liveStatus",
    status: ComponentStatus.beta,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "ARIA live region for announcements",
    importPath: "LiveStatus",
    files: ["LiveStatus.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "NavMenu",
    id: "navMenu",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Navigation menu with route awareness",
    importPath: "NavMenu",
    files: ["NavMenu.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "NativeSelect",
    id: "nativeSelect",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Native HTML select element",
    importPath: "NativeSelect",
    files: ["NativeSelect.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Portal",
    id: "portal",
    status: ComponentStatus.stable,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Render children in a portal",
    importPath: "Portal",
    files: ["Portal.svelte"],
    dependencies: [],
    dependents: ["Dialog", "Sheet", "Popover"],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Presence",
    id: "presence",
    status: ComponentStatus.stable,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Presence animation wrapper",
    importPath: "Presence",
    files: ["Presence.svelte"],
    dependencies: [],
    dependents: ["Dialog", "Sheet"],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Sidebar",
    id: "sidebar",
    status: ComponentStatus.beta,
    category: ComponentCategory.navigation,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Sidebar navigation",
    importPath: "Sidebar",
    files: ["Sidebar.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Skeleton",
    id: "skeleton",
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Loading skeleton placeholder",
    importPath: "Skeleton",
    files: ["Skeleton.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Spinner",
    id: "spinner",
    status: ComponentStatus.beta,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Loading spinner",
    importPath: "Spinner",
    files: ["Spinner.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Table",
    id: "table",
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Basic HTML table wrapper",
    importPath: "Table",
    files: ["Table.svelte"],
    dependencies: [],
    dependents: ["DataTable"],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Textarea",
    id: "textarea",
    status: ComponentStatus.beta,
    category: ComponentCategory.form,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Multi-line text input",
    importPath: "Textarea",
    files: ["Textarea.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Toast",
    id: "toast",
    status: ComponentStatus.stable,
    category: ComponentCategory.feedback,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Toast notification (svelte-sonner)",
    importPath: "Toast",
    files: ["Toast.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "Typography",
    id: "typography",
    status: ComponentStatus.beta,
    category: ComponentCategory.data,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Typography primitives (h1-h6, p, etc.)",
    importPath: "Typography",
    files: ["Typography.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
  {
    name: "VisuallyHidden",
    id: "visuallyHidden",
    status: ComponentStatus.stable,
    category: ComponentCategory.utility,
    structure: ComponentStructure.monolithic,
    since: "0.1.0",
    description: "Screen reader only content",
    importPath: "VisuallyHidden",
    files: ["VisuallyHidden.svelte"],
    dependencies: [],
    dependents: [],
    isWrapped: false,
    haTests: false,
    testCount: 0,
    hasA11yDocs: false,
    breakingChanges: [],
  },
];

// ============================================
// MANIFEST HELPERS
// ============================================

/**
 * Get a component by ID.
 */
export function getComponent(id: string): ComponentEntry | undefined {
  return MANIFEST.find((c) => c.id === id);
}

/**
 * Get all components by status.
 */
export function getComponentsByStatus(status: ComponentStatusType): ComponentEntry[] {
  return MANIFEST.filter((c) => c.status === status);
}

/**
 * Get all components by category.
 */
export function getComponentsByCategory(category: ComponentCategoryType): ComponentEntry[] {
  return MANIFEST.filter((c) => c.category === category);
}

/**
 * Get all components by structure.
 */
export function getComponentsByStructure(structure: ComponentStructureType): ComponentEntry[] {
  return MANIFEST.filter((c) => c.structure === structure);
}

/**
 * Get stable components only.
 */
export function getStableComponents(): ComponentEntry[] {
  return getComponentsByStatus(ComponentStatus.stable);
}

/**
 * Get wrapped primitives (ColdLight-enhanced).
 */
export function getWrappedPrimitives(): ComponentEntry[] {
  return MANIFEST.filter((c) => c.isWrapped);
}

/**
 * Get components with tests.
 */
export function getTestedComponents(): ComponentEntry[] {
  return MANIFEST.filter((c) => c.haTests);
}

/**
 * Get total test count.
 */
export function getTotalTestCount(): number {
  return MANIFEST.reduce((sum, c) => sum + c.testCount, 0);
}

/**
 * Get component dependencies (what it depends on).
 */
export function getDependencies(id: string): ComponentEntry[] {
  const component = getComponent(id);
  if (!component) return [];
  return component.dependencies
    .map((depId) => getComponent(depId))
    .filter((c): c is ComponentEntry => c !== undefined);
}

/**
 * Get component dependents (what depends on it).
 */
export function getDependents(id: string): ComponentEntry[] {
  const component = getComponent(id);
  if (!component) return [];
  return component.dependents
    .map((depId) => getComponent(depId))
    .filter((c): c is ComponentEntry => c !== undefined);
}

/**
 * Generate summary statistics.
 */
export function getManifestStats() {
  const total = MANIFEST.length;
  const byStatus = {
    stable: getComponentsByStatus(ComponentStatus.stable).length,
    beta: getComponentsByStatus(ComponentStatus.beta).length,
    experimental: getComponentsByStatus(ComponentStatus.experimental).length,
    deprecated: getComponentsByStatus(ComponentStatus.deprecated).length,
  };
  const byStructure = {
    compound: getComponentsByStructure(ComponentStructure.compound).length,
    monolithic: getComponentsByStructure(ComponentStructure.monolithic).length,
    reexport: getComponentsByStructure(ComponentStructure.reexport).length,
  };
  const wrapped = getWrappedPrimitives().length;
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

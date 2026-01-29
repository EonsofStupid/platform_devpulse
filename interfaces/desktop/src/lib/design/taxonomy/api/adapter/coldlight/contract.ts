/**
 * @file ColdLight Adapter Contract (Taxonomy Declaration)
 * @description Declares the capabilities and invariants of the ColdLight public API layer.
 *
 * ColdLight is the ONLY public-facing adapter surface. This contract declares:
 *   - ColdLight is the sole public API boundary
 *   - No primitive imports MeltUI directly
 *   - Slot/state/data-attribute enforcement rules
 *   - Folder rules for the public adapter surface
 *
 * This keeps "Melt provides aria/state" true internally while
 * never leaking it through the public surface.
 */

import type {
  ColdLightDataAttr,
  ColdLightPrimitive,
  ColdLightAllowedImportSource,
  ColdLightForbiddenImportPattern,
} from "./types.js";

// =============================================================================
// IDENTITY
// =============================================================================

export const ADAPTER_ID = "coldlight" as const;
export const ADAPTER_ROLE = "publicSurface" as const;

// =============================================================================
// DATA ATTRIBUTES
// =============================================================================

/** Data attributes ColdLight adds for CSS targeting */
export const DATA_ATTRS: readonly ColdLightDataAttr[] = [
  "data-kind",
  "data-slot",
  "data-state",
  "data-id",
];

// =============================================================================
// SUPPORTED PRIMITIVES
// =============================================================================

/** All primitives ColdLight exposes (superset of MeltUI + custom ARIA) */
export const SUPPORTED_PRIMITIVES: readonly ColdLightPrimitive[] = [
  "accordion",
  "alert-dialog",
  "avatar",
  "button",
  "calendar",
  "checkbox",
  "collapsible",
  "combobox",
  "context-menu",
  "date-field",
  "date-picker",
  "date-range-field",
  "date-range-picker",
  "dialog",
  "dropdown-menu",
  "label",
  "link-preview",
  "menubar",
  "pagination",
  "pin-input",
  "popover",
  "progress",
  "radio-group",
  "range-calendar",
  "scroll-area",
  "select",
  "separator",
  "slider",
  "switch",
  "table-of-contents",
  "tabs",
  "tags-input",
  "toggle",
  "toggle-group",
  "toolbar",
  "tooltip",
  "tree",
];

// =============================================================================
// IMPORT ENFORCEMENT RULES
// =============================================================================

/** Allowed import sources for primitives and public surfaces */
export const ALLOWED_IMPORTS: readonly ColdLightAllowedImportSource[] = [
  "$lib/design/taxonomy",
  "$lib/design/api/adapters/coldlight",
];

/** Forbidden imports - scanner/tests enforce these never appear in primitives */
export const FORBIDDEN_IMPORTS: readonly ColdLightForbiddenImportPattern[] = [
  "@melt-ui/svelte",
  "$lib/design/api/adapters/meltui",
];

// =============================================================================
// FOLDER RULES (scanner enforcement)
// =============================================================================

/**
 * Rules the scanner enforces for coldlight public surface folders.
 * Every primitive must have these files at the public surface.
 */
export const PUBLIC_REQUIRED_FILES = [
  "contract.ts",
  "types.ts",
  "index.ts",
] as const;

/** Public surface folder path pattern (no _internal) */
export const PUBLIC_PATH_PATTERN = "api/adapters/coldlight/<kind>/" as const;

// =============================================================================
// ASSEMBLED CONTRACT
// =============================================================================

export const contract = {
  id: ADAPTER_ID,
  role: ADAPTER_ROLE,
  dataAttrs: DATA_ATTRS,
  supportedPrimitives: SUPPORTED_PRIMITIVES,
  importRules: {
    allowed: ALLOWED_IMPORTS,
    forbidden: FORBIDDEN_IMPORTS,
  },
  folderRules: {
    pathPattern: PUBLIC_PATH_PATTERN,
    requiredFiles: PUBLIC_REQUIRED_FILES,
  },
} as const;

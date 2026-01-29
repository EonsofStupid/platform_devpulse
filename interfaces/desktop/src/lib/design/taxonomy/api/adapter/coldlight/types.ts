/**
 * @file ColdLight Adapter Type Declarations
 * @description Declares what ColdLight provides as the public agnostic API layer.
 *
 * ColdLight is the ONLY public API boundary. No primitive or public adapter
 * surface imports MeltUI directly. This file declares the invariants
 * enforced platform-wide.
 */

/** ColdLight adapter identity */
export type ColdLightAdapterId = "coldlight";

/** Data attributes ColdLight adds to all primitive elements for CSS targeting */
export type ColdLightDataAttr =
  | "data-kind"
  | "data-slot"
  | "data-state"
  | "data-id";

/**
 * ColdLight primitive - all primitives go through ColdLight.
 * This is the superset: MeltUI-backed + ColdLight custom ARIA.
 */
export type ColdLightPrimitive =
  | "accordion"
  | "alert-dialog"
  | "avatar"
  | "button"
  | "calendar"
  | "checkbox"
  | "collapsible"
  | "combobox"
  | "context-menu"
  | "date-field"
  | "date-picker"
  | "date-range-field"
  | "date-range-picker"
  | "dialog"
  | "dropdown-menu"
  | "label"
  | "link-preview"
  | "menubar"
  | "pagination"
  | "pin-input"
  | "popover"
  | "progress"
  | "radio-group"
  | "range-calendar"
  | "scroll-area"
  | "select"
  | "separator"
  | "slider"
  | "switch"
  | "table-of-contents"
  | "tabs"
  | "tags-input"
  | "toggle"
  | "toggle-group"
  | "toolbar"
  | "tooltip"
  | "tree";

/**
 * Import rule enforcement.
 * Primitives and public surfaces must ONLY import from these paths.
 */
export type ColdLightAllowedImportSource =
  | "$lib/design/taxonomy"
  | "$lib/design/api/adapters/coldlight";

/**
 * Forbidden import patterns for public surface code.
 * Scanner/tests enforce that these never appear in primitives.
 */
export type ColdLightForbiddenImportPattern =
  | "@melt-ui/svelte"
  | "$lib/design/api/adapters/meltui";

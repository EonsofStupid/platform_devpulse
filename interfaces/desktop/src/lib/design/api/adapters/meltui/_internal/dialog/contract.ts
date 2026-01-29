/**
 * @file MeltUI Dialog Adapter Contract
 * @description Defines what MeltUI provides vs what ColdLight adds for dialog.
 *
 * MeltUI handles ARIA and keyboard behavior via createDialog builder.
 * ColdLight adds data attributes for CSS targeting on top.
 */

import type { DialogSlot } from "$lib/design/taxonomy/kinds/primitives/dialog/contract";

// =============================================================================
// IDENTIFIERS
// =============================================================================

/** MeltUI builder function name */
export const MELT_BUILDER = "createDialog" as const;

/** Adapter identifier */
export const ADAPTER_ID = "meltui" as const;

/** Primitive kind (matches folder name) */
export const KIND = "dialog" as const;

// =============================================================================
// ATTRIBUTE OWNERSHIP
// =============================================================================

/**
 * Attributes MeltUI handles - do not override these.
 * MeltUI manages all ARIA and accessibility attributes for dialog.
 */
export const MELT_HANDLES = [
  "role",
  "aria-modal",
  "aria-labelledby",
  "aria-describedby",
  "tabindex",
  "id",
] as const;

/**
 * Attributes ColdLight adds on top of MeltUI.
 * These enable CSS targeting by primitive/slot/state.
 */
export const COLDLIGHT_ADDS = [
  "data-kind",
  "data-slot",
  "data-state",
] as const;

// =============================================================================
// SLOT INVENTORY
// =============================================================================

/**
 * Slot categorization for the dialog primitive.
 * Mirrors taxonomy contract slots structure.
 */
export const SLOTS = {
  required: ["root", "content"] as const satisfies readonly DialogSlot[],
  optional: [
    "trigger",
    "portal",
    "overlay",
    "title",
    "description",
    "close",
  ] as const satisfies readonly DialogSlot[],
} as const;

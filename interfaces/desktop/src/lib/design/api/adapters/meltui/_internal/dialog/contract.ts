/**
 * @file MeltUI Dialog Contract
 * @description Defines what MeltUI provides vs what ColdLight adds.
 *
 * MeltUI handles ARIA and keyboard behavior.
 * ColdLight adds data attributes for CSS targeting.
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
 * MeltUI manages all ARIA and accessibility attributes.
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
 */
export const SLOTS = {
  /** Slots that must always be rendered */
  required: ["root", "content"] as const satisfies readonly DialogSlot[],

  /** Slots that are optional based on use case */
  optional: [
    "trigger",
    "portal",
    "overlay",
    "title",
    "description",
    "close",
  ] as const satisfies readonly DialogSlot[],
} as const;

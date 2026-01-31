/**
 * @file MeltUI Dialog Types
 * @description Maps MeltUI dialog builder to ColdLight slots and states.
 *
 * MeltUI's createDialog returns elements and states with their own naming.
 * This file defines the mapping from MeltUI names → ColdLight names.
 */

import type {
  DialogSlot,
  DialogState,
} from "$lib/design/taxonomy/kinds/primitives/dialog/types";

// =============================================================================
// MELTUI ELEMENTS → COLDLIGHT SLOTS
// =============================================================================

/**
 * Element names returned by MeltUI's createDialog.
 */
export const MELT_ELEMENTS = [
  "trigger",
  "overlay",
  "content",
  "title",
  "description",
  "close",
  "portalled",
] as const;

export type MeltDialogElement = (typeof MELT_ELEMENTS)[number];

/**
 * Maps MeltUI element names to ColdLight slot names.
 * MeltUI "portalled" → ColdLight "portal"
 */
export const ELEMENT_TO_SLOT: Record<MeltDialogElement, DialogSlot> = {
  trigger: "trigger",
  overlay: "overlay",
  content: "content",
  title: "title",
  description: "description",
  close: "close",
  portalled: "portal",
} as const;

// =============================================================================
// MELTUI STATES → COLDLIGHT STATES
// =============================================================================

/**
 * State names exposed by MeltUI's createDialog.
 */
export const MELT_STATES = ["open"] as const;

export type MeltDialogState = (typeof MELT_STATES)[number];

/**
 * Maps MeltUI state names to ColdLight state tokens.
 */
export const STATE_TO_TOKEN: Record<MeltDialogState, DialogState> = {
  open: "open",
} as const;

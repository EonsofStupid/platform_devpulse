/**
 * @file Dialog Primitive Contract
 * @description Taxonomy SSOT contract for dialog kind
 */

import type { PrimitiveContract, SlotStateMap } from "$lib/design/taxonomy/types";

export const dialogSlots = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "title",
  "description",
  "close",
] as const;

export type DialogSlot = (typeof dialogSlots)[number];

export const dialogStateTokens = [
  // Presence
  "hidden",
  "visible",
  "inert",
  // Primary
  "open",
  // Focus
  "focused",
  "focus-visible",
  "focus-within",
  // Interaction
  "hover",
  "active",
  // Animation
  "entering",
  "exiting",
] as const;

export type DialogState = (typeof dialogStateTokens)[number];

export const dialogSlotStates: SlotStateMap<DialogSlot, DialogState> = {
  root: ["open"],
  trigger: ["focused", "focus-visible", "hover", "active"],
  portal: ["hidden", "visible"],
  overlay: ["visible", "entering", "exiting", "hover"],
  content: ["open", "focus-within", "entering", "exiting"],
  title: [],
  description: [],
  close: ["focused", "focus-visible", "hover", "active"],
} as const;

type DialogCollectionKey = "aria" | "keyboard";

const DIALOG_COLLECTIONS = {
  aria: {
    role: "dialog",
    requiredAttrs: ["aria-modal", "aria-labelledby"] as const,
    optionalAttrs: ["aria-describedby"] as const,
  },
  keyboard: ["Escape", "Tab"] as const,
} as const;

export const contract: PrimitiveContract<
  "dialog",
  DialogSlot,
  DialogState,
  DialogCollectionKey
> = {
  kind: "dialog",

  // Locked-in: manifest must know who provides ARIA+state builders deterministically
  ariaStateProvider: "meltui",

  slots: {
    required: ["root", "content"],
    optional: ["trigger", "portal", "overlay", "title", "description", "close"],
    forbidden: [],
  },

  states: {
    shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
    specific: ["hidden", "visible", "inert", "open", "entering", "exiting"],
  },

  slotStates: dialogSlotStates,

  // Multi-action per slot (declare even if empty right now)
  slotActions: {
    root: [],
    trigger: [],
    portal: [],
    overlay: [],
    content: [],
    title: [],
    description: [],
    close: [],
  },

  // Metadata/inventories must be accessed via get(key)
  collections: {
    get(key) {
      return DIALOG_COLLECTIONS[key];
    },
  },
};

export default contract;

/**
 * @file src/lib/design/taxonomy/slots.ts
 * @layer taxonomy
 *
 * @description
 * Slot definitions and constraints for block composition.
 *
 * @since 1.0.0
 */

import { z } from "zod";
import type { BlockKind } from "./kinds";

// ===========================================
// SLOT CONFIGURATION
// ===========================================

/**
 * Slot configuration schema.
 */
export const DsSlotConfigSchema = z.object({
  /** Whether this slot is required */
  required: z.boolean().default(false),
  /** Maximum number of children allowed (0 = unlimited) */
  maxChildren: z.number().default(0),
  /** Allowed child kinds (empty = any) */
  allowedKinds: z.array(z.string()).default([]),
  /** Default recipe for children in this slot */
  defaultChildRecipe: z.string().optional(),
});

export type DsSlotConfig = z.infer<typeof DsSlotConfigSchema>;

// ===========================================
// COMMON SLOT DEFINITIONS
// ===========================================

/**
 * Standard panel slots.
 */
export const panelSlots = {
  header: {
    required: false,
    maxChildren: 1,
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
  body: {
    required: true,
    maxChildren: 0, // unlimited
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
  footer: {
    required: false,
    maxChildren: 1,
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
} satisfies Record<string, DsSlotConfig>;

/**
 * Shell slots (5-layer structure).
 */
export const shellSlots = {
  topBar: {
    required: false,
    maxChildren: 1,
    allowedKinds: ["topBar"],
    defaultChildRecipe: "shell.topBar.default",
  },
  sideNav: {
    required: false,
    maxChildren: 1,
    allowedKinds: ["sideNav"],
    defaultChildRecipe: "shell.sideNav.default",
  },
  main: {
    required: true,
    maxChildren: 0,
    allowedKinds: ["panel", "widget"],
    defaultChildRecipe: "panel.glass.deep",
  },
  statusBar: {
    required: false,
    maxChildren: 1,
    allowedKinds: ["statusBar"],
    defaultChildRecipe: "shell.statusBar.default",
  },
  dock: {
    required: false,
    maxChildren: 1,
    allowedKinds: ["dock", "chatDock"],
    defaultChildRecipe: "chat.dock.default",
  },
} satisfies Record<string, DsSlotConfig>;

/**
 * Three-column slots (for topBar, statusBar).
 */
export const threeColumnSlots = {
  left: {
    required: false,
    maxChildren: 0,
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
  center: {
    required: false,
    maxChildren: 0,
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
  right: {
    required: false,
    maxChildren: 0,
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
} satisfies Record<string, DsSlotConfig>;

/**
 * Chat slots.
 */
export const chatSlots = {
  header: {
    required: false,
    maxChildren: 1,
    allowedKinds: [],
    defaultChildRecipe: undefined,
  },
  messages: {
    required: true,
    maxChildren: 0,
    allowedKinds: ["chatThread", "chatBubble"],
    defaultChildRecipe: "chat.bubble.user",
  },
  input: {
    required: true,
    maxChildren: 1,
    allowedKinds: ["inputFrame"],
    defaultChildRecipe: "input.glass.default",
  },
} satisfies Record<string, DsSlotConfig>;

// ===========================================
// SLOT REGISTRY
// ===========================================

/**
 * Maps block kinds to their slot configurations.
 */
export const kindSlots: Partial<Record<BlockKind, Record<string, DsSlotConfig>>> = {
  // Shell kinds
  appShell: shellSlots,
  topBar: threeColumnSlots,
  sideNav: panelSlots,
  statusBar: threeColumnSlots,
  dock: { content: { required: true, maxChildren: 0, allowedKinds: [], defaultChildRecipe: undefined } },

  // Surface kinds
  panel: panelSlots,
  card: panelSlots,
  modal: panelSlots,
  glassFrame: { content: { required: true, maxChildren: 0, allowedKinds: [], defaultChildRecipe: undefined } },

  // Chat kinds
  chatDock: chatSlots,
  chatThread: { messages: { required: true, maxChildren: 0, allowedKinds: ["chatBubble"], defaultChildRecipe: "chat.bubble.user" } },
  chatBubble: {
    content: { required: true, maxChildren: 1, allowedKinds: [], defaultChildRecipe: undefined },
    meta: { required: false, maxChildren: 1, allowedKinds: [], defaultChildRecipe: undefined },
  },
};

/**
 * Get slot configuration for a kind.
 */
export function getKindSlots(kind: BlockKind): Record<string, DsSlotConfig> | undefined {
  return kindSlots[kind];
}

/**
 * Check if a child kind is allowed in a slot.
 */
export function isChildAllowed(parentKind: BlockKind, slotName: string, childKind: BlockKind): boolean {
  const slots = kindSlots[parentKind];
  if (!slots) return true; // No constraints

  const slot = slots[slotName];
  if (!slot) return false; // Slot doesn't exist

  if (slot.allowedKinds.length === 0) return true; // Any kind allowed
  return slot.allowedKinds.includes(childKind);
}

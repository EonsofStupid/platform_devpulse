/**
 * @file taxonomy/kind/kinds.ts
 * @description Block Kind Registry (SSOT)
 *
 * This file defines ALL block kinds in the ColdLight design system.
 * Block kinds are the semantic categories that determine:
 * - Which slots a block can have
 * - Which recipes can style it
 * - Which contracts validate its props
 *
 * STRUCTURE:
 * - Category objects group related kinds (shells, surfaces, widgets, chat)
 * - Each kind has a definition with description, layoutMode, slots, recipePrefix
 * - blockKinds spreads all categories into a single registry
 * - BlockKind type is derived from the registry keys
 */

// =============================================================================
// BLOCK KIND DEFINITION
// =============================================================================

/**
 * Definition for a block kind.
 */
export interface BlockKindDefinition {
  /** Human-readable description */
  description: string;
  /** Layout mode constraint */
  layoutMode: "grid" | "flex" | "none";
  /** Prefix for recipes (e.g., "shell.topBar" for shell.topBar.default) */
  recipePrefix: string;
  /** Available slots for this kind */
  slots: readonly string[];
}

// =============================================================================
// SHELL KINDS
// =============================================================================

/**
 * Shell kinds - app-level structural containers.
 * CONSTRAINT: layoutMode MUST be "grid"
 */
export const shellKinds = {
  appShell: {
    description: "Root application shell with slot areas",
    layoutMode: "grid",
    recipePrefix: "shell.app",
    slots: ["topBar", "sideNav", "main", "statusBar", "dock"],
  },
  topBar: {
    description: "Top navigation bar",
    layoutMode: "grid",
    recipePrefix: "shell.topBar",
    slots: ["left", "center", "right"],
  },
  sideNav: {
    description: "Side navigation panel",
    layoutMode: "grid",
    recipePrefix: "shell.sideNav",
    slots: ["header", "body", "footer"],
  },
  statusBar: {
    description: "Bottom status bar",
    layoutMode: "grid",
    recipePrefix: "shell.statusBar",
    slots: ["left", "center", "right"],
  },
  dock: {
    description: "Floating dock container",
    layoutMode: "grid",
    recipePrefix: "shell.dock",
    slots: ["content"],
  },
} as const satisfies Record<string, BlockKindDefinition>;

// =============================================================================
// SURFACE KINDS
// =============================================================================

/**
 * Surface kinds - content containers.
 */
export const surfaceKinds = {
  panel: {
    description: "Content panel with header/body/footer",
    layoutMode: "flex",
    recipePrefix: "panel",
    slots: ["header", "body", "footer"],
  },
  card: {
    description: "Compact content card",
    layoutMode: "flex",
    recipePrefix: "card",
    slots: ["header", "body", "footer"],
  },
  modal: {
    description: "Modal dialog surface",
    layoutMode: "flex",
    recipePrefix: "modal",
    slots: ["header", "body", "footer"],
  },
  glassFrame: {
    description: "Frameless glass container",
    layoutMode: "flex",
    recipePrefix: "glass",
    slots: ["content"],
  },
} as const satisfies Record<string, BlockKindDefinition>;

// =============================================================================
// WIDGET KINDS
// =============================================================================

/**
 * Widget kinds - data display components.
 */
export const widgetKinds = {
  widget: {
    description: "General widget container",
    layoutMode: "flex",
    recipePrefix: "widget",
    slots: ["header", "body"],
  },
  statMeter: {
    description: "Statistical metric display",
    layoutMode: "flex",
    recipePrefix: "widget.stat",
    slots: ["value", "label"],
  },
  chart: {
    description: "Chart/graph container",
    layoutMode: "flex",
    recipePrefix: "widget.chart",
    slots: ["header", "chart"],
  },
} as const satisfies Record<string, BlockKindDefinition>;

// =============================================================================
// CHAT KINDS
// =============================================================================

/**
 * Chat kinds - messaging UI components.
 */
export const chatKinds = {
  chatDock: {
    description: "Chat dock with messages and input",
    layoutMode: "flex",
    recipePrefix: "chat.dock",
    slots: ["header", "messages", "input"],
  },
  chatThread: {
    description: "Chat thread message list",
    layoutMode: "flex",
    recipePrefix: "chat.thread",
    slots: ["messages"],
  },
  chatBubble: {
    description: "Individual chat message bubble",
    layoutMode: "flex",
    recipePrefix: "chat.bubble",
    slots: ["content", "meta"],
  },
} as const satisfies Record<string, BlockKindDefinition>;

// =============================================================================
// INPUT KINDS
// =============================================================================

/**
 * Input kinds - form and input components.
 */
export const inputKinds = {
  inputFrame: {
    description: "Text input frame container",
    layoutMode: "flex",
    recipePrefix: "input",
    slots: ["content"],
  },
} as const satisfies Record<string, BlockKindDefinition>;

// =============================================================================
// UNIFIED BLOCK KINDS REGISTRY
// =============================================================================

/**
 * All block kinds unified into a single registry.
 * This is the SSOT for block kind lookups.
 */
export const blockKinds = {
  ...shellKinds,
  ...surfaceKinds,
  ...widgetKinds,
  ...chatKinds,
  ...inputKinds,
} as const;

// =============================================================================
// DERIVED TYPES
// =============================================================================

/**
 * Union type of all block kind names.
 */
export type BlockKind = keyof typeof blockKinds;

/**
 * Type-safe array of all block kind names.
 */
export const blockKindNames = Object.keys(blockKinds) as BlockKind[];

/**
 * Shell kind names.
 */
export type ShellKind = keyof typeof shellKinds;

/**
 * Surface kind names.
 */
export type SurfaceKind = keyof typeof surfaceKinds;

/**
 * Widget kind names.
 */
export type WidgetKind = keyof typeof widgetKinds;

/**
 * Chat kind names.
 */
export type ChatKind = keyof typeof chatKinds;

/**
 * Input kind names.
 */
export type InputKind = keyof typeof inputKinds;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get the definition for a block kind.
 */
export function getKindDefinition(kind: BlockKind): BlockKindDefinition {
  return blockKinds[kind];
}

/**
 * Check if a string is a valid block kind.
 */
export function isBlockKind(value: string): value is BlockKind {
  return value in blockKinds;
}

/**
 * Get all kinds with a specific layout mode.
 */
export function getKindsByLayoutMode(
  mode: "grid" | "flex" | "none"
): BlockKind[] {
  return blockKindNames.filter((kind) => blockKinds[kind].layoutMode === mode);
}

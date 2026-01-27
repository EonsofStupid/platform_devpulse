/**
 * @file src/lib/design/taxonomy/kinds.ts
 * @layer taxonomy
 *
 * @description
 * Block kind definitions with constraints.
 * Every block kind must be defined here before a renderer can exist.
 *
 * @since 1.0.0
 */

// ===========================================
// BLOCK KIND DEFINITIONS
// ===========================================

/**
 * Layout mode constraint for block kinds.
 * - "grid": Must use CSS Grid (shell, dashboard)
 * - "flex": Can use flexbox (inline content)
 * - "none": No layout constraint (leaf nodes)
 */
export type LayoutMode = "grid" | "flex" | "none";

/**
 * Block kind definition with constraints.
 */
export interface BlockKindDefinition {
  /** Human-readable description */
  description: string;
  /** Layout mode constraint */
  layoutMode: LayoutMode;
  /** Allowed recipe prefixes for this kind */
  recipePrefix: string;
  /** Allowed slot names */
  slots: readonly string[];
  /** Allowed child kinds per slot (empty = any) */
  allowedChildren?: Partial<Record<string, readonly string[]>>;
}

// ===========================================
// SHELL KINDS (CSS Grid required)
// ===========================================

export const shellKinds = {
  appShell: {
    description: "Root application shell with 5-layer structure",
    layoutMode: "grid" as const,
    recipePrefix: "shell",
    slots: ["topBar", "sideNav", "main", "statusBar", "dock"],
    allowedChildren: {
      topBar: ["topBar"],
      sideNav: ["sideNav"],
      main: ["panel", "widget"],
      statusBar: ["statusBar"],
      dock: ["dock", "chatDock"],
    },
  },
  topBar: {
    description: "Top navigation bar",
    layoutMode: "grid" as const,
    recipePrefix: "shell.topBar",
    slots: ["left", "center", "right"],
  },
  sideNav: {
    description: "Side navigation panel",
    layoutMode: "grid" as const,
    recipePrefix: "shell.sideNav",
    slots: ["header", "body", "footer"],
  },
  statusBar: {
    description: "Bottom status bar",
    layoutMode: "grid" as const,
    recipePrefix: "shell.statusBar",
    slots: ["left", "center", "right"],
  },
  dock: {
    description: "Floating dock container",
    layoutMode: "grid" as const,
    recipePrefix: "shell.dock",
    slots: ["content"],
  },
} as const;

// ===========================================
// SURFACE KINDS
// ===========================================

export const surfaceKinds = {
  panel: {
    description: "Generic container panel",
    layoutMode: "none" as const,
    recipePrefix: "panel",
    slots: ["header", "body", "footer"],
  },
  card: {
    description: "Card surface for content",
    layoutMode: "none" as const,
    recipePrefix: "card",
    slots: ["header", "body", "footer"],
  },
  modal: {
    description: "Modal overlay",
    layoutMode: "none" as const,
    recipePrefix: "modal",
    slots: ["header", "body", "footer"],
  },
  glassFrame: {
    description: "Glass frame container",
    layoutMode: "none" as const,
    recipePrefix: "glass",
    slots: ["content"],
  },
  inputFrame: {
    description: "Input field container",
    layoutMode: "none" as const,
    recipePrefix: "input",
    slots: ["prefix", "input", "suffix"],
  },
} as const;

// ===========================================
// WIDGET KINDS (CSS Grid for dashboard)
// ===========================================

export const widgetKinds = {
  widget: {
    description: "Dashboard widget container",
    layoutMode: "grid" as const,
    recipePrefix: "widget",
    slots: ["header", "body"],
  },
  statMeter: {
    description: "Stat display widget",
    layoutMode: "none" as const,
    recipePrefix: "widget.stat",
    slots: ["value", "label"],
  },
  chart: {
    description: "Chart widget",
    layoutMode: "none" as const,
    recipePrefix: "widget.chart",
    slots: ["header", "chart"],
  },
} as const;

// ===========================================
// CHAT KINDS
// ===========================================

export const chatKinds = {
  chatDock: {
    description: "Chat dock panel",
    layoutMode: "grid" as const,
    recipePrefix: "chat.dock",
    slots: ["header", "messages", "input"],
  },
  chatThread: {
    description: "Chat message thread",
    layoutMode: "none" as const,
    recipePrefix: "chat.thread",
    slots: ["messages"],
  },
  chatBubble: {
    description: "Single chat message bubble",
    layoutMode: "none" as const,
    recipePrefix: "chat.bubble",
    slots: ["content", "meta"],
  },
} as const;

// ===========================================
// COMBINED REGISTRY
// ===========================================

export const blockKinds = {
  ...shellKinds,
  ...surfaceKinds,
  ...widgetKinds,
  ...chatKinds,
} as const;

export type BlockKind = keyof typeof blockKinds;
export const blockKindKeys = Object.keys(blockKinds) as BlockKind[];

/**
 * Get kind definition by name.
 */
export function getKindDefinition(kind: BlockKind): BlockKindDefinition {
  return blockKinds[kind];
}

/**
 * Check if kind requires CSS Grid layout.
 */
export function requiresGridLayout(kind: BlockKind): boolean {
  return blockKinds[kind].layoutMode === "grid";
}

/**
 * Get allowed slots for a kind.
 */
export function getKindSlots(kind: BlockKind): readonly string[] {
  return blockKinds[kind].slots;
}

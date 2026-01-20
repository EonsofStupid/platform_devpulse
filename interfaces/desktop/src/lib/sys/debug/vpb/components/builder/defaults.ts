/**
 * @file src/lib/sys/debug/vpb/components/builder/defaults.ts
 * @description Default props and recipes for each block kind.
 *
 * Provides sensible defaults when creating new blocks.
 * All defaults are derived from taxonomy contracts via Zod schema defaults.
 *
 * @since 1.0.0
 */

import type { BlockKind } from "$lib/design/taxonomy/kinds";
import {
  type KindContract,
  kindContracts,
  getDefaultProps,
} from "$lib/design/taxonomy/contracts";
import { getRecipesForKind } from "$lib/design/recipes";
import { type BlockNode, createBlockNode } from "./schema";

// ===========================================
// DEFAULT RECIPE MAPPING
// ===========================================

/**
 * Default recipe ID for each block kind.
 * Recipes must exist in recipeRegistry.
 */
export const defaultRecipes: Record<BlockKind, string> = {
  // Shell kinds
  appShell: "shell.app.default",
  topBar: "shell.topBar.default",
  sideNav: "shell.sideNav.default",
  statusBar: "shell.statusBar.default",
  dock: "shell.dock.default",

  // Surface kinds
  panel: "panel.glass.default",
  card: "card.glass.default",
  modal: "modal.glass.default",
  glassFrame: "glass.frame.default",
  inputFrame: "input.glass.default",

  // Widget kinds
  widget: "widget.default",
  statMeter: "widget.stat.default",
  chart: "widget.chart.default",

  // Chat kinds
  chatDock: "chat.dock.default",
  chatThread: "chat.thread.default",
  chatBubble: "chat.bubble.user",
};

/**
 * Get the default recipe for a kind.
 * Falls back to first available recipe if default doesn't exist.
 */
export function getDefaultRecipe(kind: BlockKind): string {
  const defaultId = defaultRecipes[kind];
  const available = getRecipesForKind(kind);

  // Check if default exists
  if (available.some((r) => r.id === defaultId)) {
    return defaultId;
  }

  // Fallback to first available
  if (available.length > 0) {
    return available[0].id;
  }

  // Last resort: construct from recipe prefix
  return `${kind}.default`;
}

// ===========================================
// DEFAULT PROPS (FROM CONTRACTS)
// ===========================================

/**
 * Get default props for a kind.
 * Uses Zod schema defaults from kindContracts.
 */
export function getKindDefaultProps(kind: BlockKind): unknown {
  if (kind in kindContracts) {
    return getDefaultProps(kind as KindContract);
  }
  // Fallback for kinds without contracts
  return {};
}

// ===========================================
// BLOCK FACTORY
// ===========================================

/**
 * Create a new block with all defaults applied.
 * This is the primary factory for new blocks in VPB.
 */
export function createDefaultBlock<K extends BlockKind>(
  kind: K,
  overrides?: {
    recipe?: string;
    props?: Partial<BlockNode<K>["props"]>;
    meta?: BlockNode<K>["meta"];
  }
): BlockNode<K> {
  const recipe = overrides?.recipe ?? getDefaultRecipe(kind);
  const defaultProps = getKindDefaultProps(kind);

  return createBlockNode(kind, recipe, {
    props: { ...(defaultProps as object), ...(overrides?.props as object) },
    meta: overrides?.meta,
  });
}

// ===========================================
// STARTER TEMPLATES
// ===========================================

/**
 * Pre-configured block templates for common use cases.
 */
export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  category: "shell" | "surface" | "widget" | "chat";
  /** Factory function that creates the block tree */
  create: () => BlockNode;
}

/**
 * Create a basic app shell with slots.
 */
function createAppShellTemplate(): BlockNode<"appShell"> {
  return createDefaultBlock("appShell", {
    recipe: "shell.app.default",
  });
}

/**
 * Create a glass panel.
 */
function createGlassPanelTemplate(): BlockNode<"panel"> {
  return createDefaultBlock("panel", {
    recipe: "panel.glass.default",
    props: {
      panel: { padding: "md", scrollable: false },
    },
  });
}

/**
 * Create a matte panel.
 */
function createMattePanelTemplate(): BlockNode<"panel"> {
  return createDefaultBlock("panel", {
    recipe: "panel.solid.default",
    props: {
      panel: { padding: "md", scrollable: false },
    },
  });
}

/**
 * Create a glass card.
 */
function createGlassCardTemplate(): BlockNode<"card"> {
  return createDefaultBlock("card", {
    recipe: "card.glass.default",
  });
}

/**
 * Create a chat dock.
 */
function createChatDockTemplate(): BlockNode<"chatDock"> {
  return createDefaultBlock("chatDock", {
    recipe: "chat.dock.default",
    props: {
      dock: { side: "right", state: "open" },
      header: { mode: "compact" },
      presence: "active",
    },
  });
}

/**
 * Create a stat widget.
 */
function createStatWidgetTemplate(): BlockNode<"statMeter"> {
  return createDefaultBlock("statMeter", {
    recipe: "widget.stat.default",
  });
}

/**
 * Available block templates.
 */
export const blockTemplates: BlockTemplate[] = [
  {
    id: "app-shell",
    name: "App Shell",
    description: "Full application shell with 5-layer structure",
    category: "shell",
    create: createAppShellTemplate,
  },
  {
    id: "glass-panel",
    name: "Glass Panel",
    description: "Translucent glass panel with backdrop blur",
    category: "surface",
    create: createGlassPanelTemplate,
  },
  {
    id: "matte-panel",
    name: "Matte Panel",
    description: "Solid matte panel",
    category: "surface",
    create: createMattePanelTemplate,
  },
  {
    id: "glass-card",
    name: "Glass Card",
    description: "Glass card for content display",
    category: "surface",
    create: createGlassCardTemplate,
  },
  {
    id: "chat-dock",
    name: "Chat Dock",
    description: "Floating chat panel",
    category: "chat",
    create: createChatDockTemplate,
  },
  {
    id: "stat-widget",
    name: "Stat Widget",
    description: "Single metric display",
    category: "widget",
    create: createStatWidgetTemplate,
  },
];

/**
 * Get template by ID.
 */
export function getTemplate(id: string): BlockTemplate | undefined {
  return blockTemplates.find((t) => t.id === id);
}

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(
  category: BlockTemplate["category"]
): BlockTemplate[] {
  return blockTemplates.filter((t) => t.category === category);
}

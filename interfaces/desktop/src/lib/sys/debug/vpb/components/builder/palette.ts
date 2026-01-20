/**
 * @file src/lib/sys/debug/vpb/components/builder/palette.ts
 * @description Block palette for VPB builder.
 *
 * Consumes taxonomy/kinds to generate the palette of available blocks.
 * Each palette item maps to a BlockKind with its default recipe.
 *
 * @since 1.0.0
 */

import {
  type BlockKind,
  blockKinds,
  blockKindKeys,
  shellKinds,
  surfaceKinds,
  widgetKinds,
  chatKinds,
  getKindDefinition,
  type BlockKindDefinition,
} from "$lib/design/taxonomy/kinds";
import { getRecipesForKind, type RecipeDefinition } from "$lib/design/recipes";

// ===========================================
// PALETTE ITEM TYPES
// ===========================================

/**
 * Palette category for organizing blocks.
 */
export type PaletteCategory = "shell" | "surface" | "widget" | "chat";

/**
 * Single palette item representing a draggable block.
 */
export interface PaletteItem {
  /** Block kind from taxonomy */
  kind: BlockKind;
  /** Display label */
  label: string;
  /** Description from taxonomy */
  description: string;
  /** Category for grouping */
  category: PaletteCategory;
  /** Icon identifier (for UI) */
  icon: string;
  /** Default recipe when dropped */
  defaultRecipe: string;
  /** Available recipes for this kind */
  availableRecipes: string[];
  /** Layout mode from taxonomy */
  layoutMode: "grid" | "flex" | "none";
  /** Whether this is a root-level block */
  isRoot: boolean;
}

/**
 * Palette category with grouped items.
 */
export interface PaletteCategoryGroup {
  id: PaletteCategory;
  label: string;
  description: string;
  items: PaletteItem[];
}

// ===========================================
// ICON MAPPING
// ===========================================

/**
 * Maps block kinds to icon identifiers.
 * Icons are resolved by the UI layer (Lucide, custom SVG, etc.)
 */
const kindIcons: Record<BlockKind, string> = {
  // Shell
  appShell: "layout-dashboard",
  topBar: "panel-top",
  sideNav: "panel-left",
  statusBar: "panel-bottom",
  dock: "dock",

  // Surface
  panel: "square",
  card: "card",
  modal: "popup",
  glassFrame: "frame",
  inputFrame: "text-cursor",

  // Widget
  widget: "gauge",
  statMeter: "activity",
  chart: "chart-line",

  // Chat
  chatDock: "message-square",
  chatThread: "messages",
  chatBubble: "message-circle",
};

// ===========================================
// CATEGORY DETECTION
// ===========================================

/**
 * Determine the category for a block kind.
 */
function getKindCategory(kind: BlockKind): PaletteCategory {
  if (kind in shellKinds) return "shell";
  if (kind in surfaceKinds) return "surface";
  if (kind in widgetKinds) return "widget";
  if (kind in chatKinds) return "chat";
  // Default fallback
  return "surface";
}

/**
 * Check if a kind is typically a root-level block.
 */
function isRootKind(kind: BlockKind): boolean {
  return kind === "appShell";
}

// ===========================================
// PALETTE GENERATION (FROM TAXONOMY)
// ===========================================

/**
 * Generate a palette item from a block kind.
 * Consumes taxonomy and recipes registries.
 */
function createPaletteItem(kind: BlockKind): PaletteItem {
  const def = getKindDefinition(kind);
  const recipes = getRecipesForKind(kind);
  const recipeIds = recipes.map((r) => r.id);

  // Generate a sensible default recipe
  const defaultRecipe =
    recipeIds.length > 0
      ? recipeIds.find((id) => id.includes("default")) || recipeIds[0]
      : `${def.recipePrefix}.default`;

  // Convert kind to display label
  const label = kind
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());

  return {
    kind,
    label,
    description: def.description,
    category: getKindCategory(kind),
    icon: kindIcons[kind] || "box",
    defaultRecipe,
    availableRecipes: recipeIds,
    layoutMode: def.layoutMode,
    isRoot: isRootKind(kind),
  };
}

/**
 * All palette items, generated from taxonomy.
 * This is the SSOT - derived from blockKinds.
 */
export const paletteItems: PaletteItem[] = blockKindKeys.map(createPaletteItem);

/**
 * Palette items indexed by kind for quick lookup.
 */
export const paletteByKind: Record<BlockKind, PaletteItem> = Object.fromEntries(
  paletteItems.map((item) => [item.kind, item])
) as Record<BlockKind, PaletteItem>;

// ===========================================
// GROUPED PALETTE (FOR UI)
// ===========================================

/**
 * Category metadata for UI.
 */
const categoryMeta: Record<
  PaletteCategory,
  { label: string; description: string }
> = {
  shell: {
    label: "Shell",
    description: "App chrome and layout structure",
  },
  surface: {
    label: "Surfaces",
    description: "Panels, cards, and containers",
  },
  widget: {
    label: "Widgets",
    description: "Data display components",
  },
  chat: {
    label: "Chat",
    description: "Chat UI components",
  },
};

/**
 * Palette items grouped by category.
 */
export const paletteGroups: PaletteCategoryGroup[] = (
  ["shell", "surface", "widget", "chat"] as PaletteCategory[]
).map((category) => ({
  id: category,
  ...categoryMeta[category],
  items: paletteItems.filter((item) => item.category === category),
}));

// ===========================================
// PALETTE QUERIES
// ===========================================

/**
 * Get palette item by kind.
 */
export function getPaletteItem(kind: BlockKind): PaletteItem | undefined {
  return paletteByKind[kind];
}

/**
 * Get palette items for a category.
 */
export function getPaletteByCategory(category: PaletteCategory): PaletteItem[] {
  return paletteItems.filter((item) => item.category === category);
}

/**
 * Get root-level palette items (for starting a new tree).
 */
export function getRootPaletteItems(): PaletteItem[] {
  return paletteItems.filter((item) => item.isRoot);
}

/**
 * Get palette items that can be children of a specific kind/slot.
 * Consumes taxonomy/slots constraints.
 */
export function getAllowedChildItems(
  parentKind: BlockKind,
  slotName: string
): PaletteItem[] {
  const def = getKindDefinition(parentKind);

  // If no allowedChildren defined, all items are allowed
  if (!def.allowedChildren) {
    return paletteItems;
  }

  const allowedKinds = def.allowedChildren[slotName];

  // If slot not in allowedChildren, check if it exists in slots
  if (!allowedKinds) {
    // Slot exists but no constraints = allow all
    if (def.slots.includes(slotName)) {
      return paletteItems;
    }
    // Slot doesn't exist = allow nothing
    return [];
  }

  // Filter palette items by allowed kinds
  return paletteItems.filter((item) =>
    allowedKinds.includes(item.kind as string)
  );
}

/**
 * Search palette items by label or description.
 */
export function searchPalette(query: string): PaletteItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return paletteItems;

  return paletteItems.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.kind.toLowerCase().includes(q)
  );
}

// ===========================================
// RECIPE HELPERS
// ===========================================

/**
 * Get available recipes for a palette item.
 */
export function getRecipesForPaletteItem(
  item: PaletteItem
): RecipeDefinition[] {
  return getRecipesForKind(item.kind);
}

/**
 * Check if a recipe ID is valid for a kind.
 */
export function isRecipeValidForKind(recipeId: string, kind: BlockKind): boolean {
  const recipes = getRecipesForKind(kind);
  return recipes.some((r) => r.id === recipeId);
}

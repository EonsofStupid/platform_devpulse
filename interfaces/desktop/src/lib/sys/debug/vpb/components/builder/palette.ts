/**
 * @file src/lib/sys/debug/vpb/components/builder/palette.ts
 * @description Block palette for VPB builder.
 *
 * Consumes taxonomy/kinds to generate the palette of available blocks.
 * Each palette item maps to a kind with its default recipe. Category and
 * kind text is copy (`[vpb.categories]`, `[vpb.kinds]`).
 *
 * @since 1.0.0
 */

import { BLOCK_CATEGORIES, type BlockCategory } from "@devpulse/coldlight/blocks";
import {
	getAllowedChildren,
	getKindDefinition,
	type KindLayoutMode,
	kindsInCategory,
} from "../../registry/vpb-kinds.js";
import { recipesForKind, type VpbRecipe } from "../../registry/vpb-recipes.js";

// ===========================================
// PALETTE ITEM TYPES
// ===========================================

/**
 * Palette category for organizing blocks.
 */
export type PaletteCategory = BlockCategory;

/**
 * Single palette item representing a draggable block.
 */
export interface PaletteItem {
	/** Block kind from taxonomy */
	kind: string;
	/** Display label */
	label: string;
	/** Category for grouping */
	category: PaletteCategory;
	/** Default recipe when dropped */
	defaultRecipe: string;
	/** Available recipes for this kind */
	availableRecipes: string[];
	/** Layout mode from taxonomy */
	layoutMode: KindLayoutMode;
	/** Whether this is a root-level block */
	isRoot: boolean;
}

/**
 * Palette category with grouped items.
 */
export interface PaletteCategoryGroup {
	id: PaletteCategory;
	items: PaletteItem[];
}

// ===========================================
// PALETTE GENERATION (FROM TAXONOMY)
// ===========================================

/**
 * Check if a kind is typically a root-level block.
 */
function isRootKind(kind: string): boolean {
	return kind === "app-shell";
}

/** Convert a kind to its display label. */
export function kindLabel(kind: string): string {
	return kind
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Generate a palette item from a block kind.
 * Consumes taxonomy and recipes registries.
 */
function createPaletteItem(kind: string, category: PaletteCategory): PaletteItem {
	return {
		kind,
		label: kindLabel(kind),
		category,
		defaultRecipe: `${kind}-default`,
		availableRecipes: recipesForKind(kind).map((r) => r.id),
		layoutMode: getKindDefinition(kind).layoutMode,
		isRoot: isRootKind(kind),
	};
}

const categories = Object.keys(BLOCK_CATEGORIES) as PaletteCategory[];

/**
 * Palette items grouped by category.
 */
export const paletteGroups: PaletteCategoryGroup[] = categories.map((category) => ({
	id: category,
	items: kindsInCategory(category).map((kind) => createPaletteItem(kind, category)),
}));

/**
 * All palette items, generated from taxonomy.
 * This is the SSOT - derived from the kinds of each category.
 */
export const paletteItems: PaletteItem[] = paletteGroups.flatMap((group) => group.items);

/**
 * Palette items indexed by kind for quick lookup.
 */
export const paletteByKind: Readonly<Record<string, PaletteItem>> = Object.fromEntries(
	paletteItems.map((item) => [item.kind, item]),
);

// ===========================================
// PALETTE QUERIES
// ===========================================

/**
 * Get palette item by kind.
 */
export function getPaletteItem(kind: string): PaletteItem | undefined {
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
export function getAllowedChildItems(parentKind: string, slotName: string): PaletteItem[] {
	if (!getKindDefinition(parentKind).slots.includes(slotName)) return [];
	const allowed = getAllowedChildren(parentKind, slotName);
	return allowed === "any"
		? paletteItems
		: paletteItems.filter((item) => allowed.includes(item.kind));
}

/**
 * Search palette items by kind, label or description.
 */
export function searchPalette(
	query: string,
	describeKind: (kind: string) => string = () => "",
): PaletteItem[] {
	const q = query.toLowerCase().trim();
	if (!q) return paletteItems;

	return paletteItems.filter(
		(item) =>
			item.label.toLowerCase().includes(q) ||
			item.kind.toLowerCase().includes(q) ||
			describeKind(item.kind).toLowerCase().includes(q),
	);
}

// ===========================================
// RECIPE HELPERS
// ===========================================

/**
 * Get available recipes for a palette item.
 */
export function getRecipesForPaletteItem(item: PaletteItem): readonly VpbRecipe[] {
	return recipesForKind(item.kind);
}

/**
 * Check if a recipe ID is valid for a kind.
 */
export function isRecipeValidForKind(recipeId: string, kind: string): boolean {
	return recipesForKind(kind).some((r) => r.id === recipeId);
}

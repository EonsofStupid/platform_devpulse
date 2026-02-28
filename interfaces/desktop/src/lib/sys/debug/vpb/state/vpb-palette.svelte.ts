/**
 * @file VPB Palette State — Svelte 5 Rune Class
 * @layer vpb
 * @package @devpulse/sys
 *
 * Palette state for the VPB component picker.
 * Reads from BLOCK_CATEGORIES and the recipe registry.
 */

import { getRecipesForKind } from "$lib/design/recipes/index.js";
import { BLOCK_CATEGORIES, type BlockCategory } from "$lib/design/blocks/kinds.js";

class VpbPaletteState {
	searchQuery = $state<string>("");
	activeCategory = $state<BlockCategory>("surfaces");

	get categories(): BlockCategory[] {
		return Object.keys(BLOCK_CATEGORIES) as BlockCategory[];
	}

	get kindsInCategory(): readonly string[] {
		return BLOCK_CATEGORIES[this.activeCategory] ?? [];
	}

	get filteredKinds(): string[] {
		const kinds = this.kindsInCategory;
		if (!this.searchQuery) return [...kinds];
		const q = this.searchQuery.toLowerCase();
		return kinds.filter((k) => k.toLowerCase().includes(q));
	}

	getRecipesForKind(kind: string) {
		return getRecipesForKind(kind);
	}

	setCategory(category: BlockCategory): void {
		this.activeCategory = category;
	}

	setSearch(query: string): void {
		this.searchQuery = query;
	}
}

export const vpbPalette = new VpbPaletteState();

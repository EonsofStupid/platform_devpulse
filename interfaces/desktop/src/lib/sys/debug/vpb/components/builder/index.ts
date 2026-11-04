/**
 * @file src/lib/sys/debug/vpb/components/builder/index.ts
 * @description VPB Builder module barrel export.
 * @since 1.0.0
 */

// Templates
export {
	type BlockTemplate,
	blockTemplates,
	getTemplate,
	getTemplatesByCategory,
} from "./defaults.js";

// Palette
export {
	getAllowedChildItems,
	getPaletteByCategory,
	getPaletteItem,
	getRecipesForPaletteItem,
	getRootPaletteItems,
	isRecipeValidForKind,
	kindLabel,
	type PaletteCategory,
	type PaletteCategoryGroup,
	type PaletteItem,
	paletteByKind,
	paletteGroups,
	paletteItems,
	searchPalette,
} from "./palette.js";
// Schema and types
export {
	type CreateBlockOptions,
	createBlock,
	generateBlockId,
	isBlockKind,
	type ValidationResult,
	validateBlockNode,
	validateBlockTree,
} from "./schema.js";

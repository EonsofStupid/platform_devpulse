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
} from "./defaults";

// Palette
export {
	getAllowedChildItems,
	getPaletteByCategory,
	getPaletteItem,
	getRecipesForPaletteItem,
	getRootPaletteItems,
	isRecipeValidForKind,
	type PaletteCategory,
	type PaletteCategoryGroup,
	type PaletteItem,
	paletteByKind,
	paletteGroups,
	paletteItems,
	searchPalette,
} from "./palette";
// Schema and types
export {
	type BlockMetadata,
	BlockMetadataSchema,
	type BlockNode,
	BlockNodeSchema,
	BlockTreeSchema,
	type CreateBlockOptions,
	createBlock,
	generateBlockId,
	isBlockKind,
	type KindProps,
	type KindSlots,
	type ValidationResult,
	validateBlockNode,
	validateBlockTree,
} from "./schema";

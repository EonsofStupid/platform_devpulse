/**
 * @file src/lib/sys/debug/vpb/components/builder/index.ts
 * @description VPB Builder module barrel export.
 * @since 1.0.0
 */

// Schema and types
export {
  type BlockNode,
  type BlockMetadata,
  type ValidationResult,
  type KindProps,
  type KindSlots,
  BlockNodeSchema,
  BlockTreeSchema,
  BlockMetadataSchema,
  validateBlockNode,
  validateBlockTree,
  generateBlockId,
  createBlockNode,
  isBlockKind,
} from "./schema";

// Palette
export {
  type PaletteItem,
  type PaletteCategory,
  type PaletteCategoryGroup,
  paletteItems,
  paletteByKind,
  paletteGroups,
  getPaletteItem,
  getPaletteByCategory,
  getRootPaletteItems,
  getAllowedChildItems,
  searchPalette,
  getRecipesForPaletteItem,
  isRecipeValidForKind,
} from "./palette";

// Defaults
export {
  defaultRecipes,
  getDefaultRecipe,
  getKindDefaultProps,
  createDefaultBlock,
  type BlockTemplate,
  blockTemplates,
  getTemplate,
  getTemplatesByCategory,
} from "./defaults";

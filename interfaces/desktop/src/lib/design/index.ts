/**
 * @file ColdLight Design System
 * @package @devpulse/coldlight
 *
 * Only exports what actually exists and compiles.
 * Components added here as they are built against taxonomy contracts.
 */

// Components
export {
	Button,
	Grid, Stack, HStack, Box, Container,
	Text, Heading,
	Stat, Badge, Card, Separator,
} from "./components/index.js";
export type { ComponentSurfaceProps } from "./components/types.js";

// Blocks
export { Widget, WidgetHeader, WidgetTabs, WidgetContent, WidgetFooter } from "./blocks/widgets/index.js";
export type { WidgetProps, WidgetTab, WidgetSize } from "./blocks/widgets/index.js";

// Block infrastructure
export { BlockNodeSchema, BlockDocumentSchema, createBlockNode, createBlockDocument, BLOCK_CATEGORIES } from "./blocks/index.js";
export type { BlockNode, BlockDocument, BlockCategory } from "./blocks/index.js";

// Renderers
export { BlockRenderer, resolveClasses } from "./renderers/index.js";
export type { RendererContext } from "./renderers/index.js";

// Recipes
export { getRecipe, getRecipesForKind, registerRecipe } from "./recipes/index.js";
export type { DsSurfaceProps, RecipeDefinition } from "./recipes/types.js";

// Recipe registration (side-effect imports — triggers registerRecipe calls)
import "./recipes/layouts/shell/index.js";
import "./recipes/blocks/widget/index.js";

// Blueprints
export { getBlueprint, getBlueprintsForKind, registerBlueprint } from "./blueprints/index.js";
export type { BlueprintDefinition } from "./blueprints/types.js";

// Tokens
export * from "./tokens/index.js";

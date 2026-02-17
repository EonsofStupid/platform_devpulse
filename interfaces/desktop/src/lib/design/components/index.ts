/**
 * @file components/index.ts
 * @layer components
 *
 * Component exports. Components will be added as they are built
 * against taxonomy contracts with proper ARIA enforcement.
 */

export type { ComponentSurfaceProps } from "./types.js";

// ============================================
// COMPONENTS
// ============================================

export {
	Button,
	buttonComponentContract,
	buttonRecipe,
	type ButtonComponentProps,
	type ButtonIntent,
	type ButtonSize,
} from "./button/index.js";

/**
 * @file ScrollArea Component Barrel
 * @kind scroll-area
 * @layer components
 */

export { default as ScrollArea } from "./ScrollArea.svelte";
export { contract as scrollAreaComponentContract } from "./contract.js";
export {
	scrollAreaRecipe,
	scrollAreaViewportRecipe,
	scrollAreaScrollbarRecipe,
	scrollAreaThumbRecipe,
} from "./recipe.js";
export type { ScrollAreaComponentProps, ScrollAreaSize, ScrollAreaOrientation } from "./types.js";

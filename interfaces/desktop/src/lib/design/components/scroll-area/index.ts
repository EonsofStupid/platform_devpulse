/**
 * @file ScrollArea Component Barrel
 * @kind scroll-area
 * @layer components
 */

export { contract as scrollAreaComponentContract } from "./contract.js";
export {
	scrollAreaRecipe,
	scrollAreaScrollbarRecipe,
	scrollAreaThumbRecipe,
	scrollAreaViewportRecipe,
} from "./recipe.js";
export { default as ScrollArea } from "./ScrollArea.svelte";
export type { ScrollAreaComponentProps, ScrollAreaOrientation, ScrollAreaSize } from "./types.js";

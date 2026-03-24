/**
 * @file ScrollArea Component Barrel
 * @kind scroll-area
 * @layer components
 */

export {
	scrollAreaComposition,
	scrollAreaScrollbarComposition,
	scrollAreaThumbComposition,
	scrollAreaViewportComposition,
} from "./composition.js";
export { default as ScrollArea } from "./ScrollArea.svelte";
export type { ScrollAreaComponentProps, ScrollAreaOrientation, ScrollAreaSize } from "./types.js";

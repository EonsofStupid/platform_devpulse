/**
 * @file Flex Component Barrel
 * @kind flex
 * @layer components
 */

export { contract as flexComponentContract } from "./contract.js";
export { default as Flex } from "./Flex.svelte";
export { flexRecipe } from "./recipe.js";
export type {
	FlexAlign,
	FlexComponentProps,
	FlexDirection,
	FlexGap,
	FlexJustify,
} from "./types.js";

/**
 * @file DescriptionList Component Barrel
 * @kind description-list
 * @layer components
 */

export { contract as descriptionListComponentContract } from "./contract.js";
export { default as DescriptionList } from "./DescriptionList.svelte";
export { descriptionListRecipe } from "./recipe.js";
export type {
	DescriptionListComponentProps,
	DescriptionListSize,
	DescriptionListVariant,
} from "./types.js";

/**
 * @file DescriptionList Component Barrel
 * @kind description-list
 * @layer components
 */

export { contract as descriptionListComponentContract } from "./contract.js";
export { default as DescriptionList } from "./DescriptionList.svelte";
export { descriptionListComposition } from "./composition.js";
export type {
	DescriptionListComponentProps,
	DescriptionListSize,
	DescriptionListVariant,
} from "./types.js";

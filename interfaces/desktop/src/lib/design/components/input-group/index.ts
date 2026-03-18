/**
 * @file Input Group Component Barrel
 * @kind input-group
 * @layer components
 */

export { contract as inputGroupComponentContract } from "./contract.js";
export { default as InputGroup } from "./InputGroup.svelte";
export {
	inputGroupInputRecipe,
	inputGroupPrefixRecipe,
	inputGroupRecipe,
	inputGroupSuffixRecipe,
} from "./recipe.js";
export type { InputGroupComponentProps, InputGroupSize } from "./types.js";

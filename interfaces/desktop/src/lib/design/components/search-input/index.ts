/**
 * @file Search Input Component Barrel
 * @kind search-input
 * @layer components
 */

export { contract as searchInputComponentContract } from "./contract.js";
export {
	searchInputClearRecipe,
	searchInputIconRecipe,
	searchInputInputRecipe,
	searchInputRecipe,
} from "./recipe.js";
export { default as SearchInput } from "./SearchInput.svelte";
export type { SearchInputComponentProps, SearchInputSize } from "./types.js";

/**
 * @file Pagination Component Barrel
 * @kind pagination
 * @layer components
 */

export { default as Pagination } from "./Pagination.svelte";
export { contract as paginationComponentContract } from "./contract.js";
export {
	paginationRootRecipe,
	paginationPageRecipe,
	paginationNavRecipe,
	paginationEllipsisRecipe,
} from "./recipe.js";
export type { PaginationComponentProps, PaginationSize } from "./types.js";

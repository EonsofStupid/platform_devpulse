/**
 * @file Pagination Component Barrel
 * @kind pagination
 * @layer components
 */

export { contract as paginationComponentContract } from "./contract.js";
export { default as Pagination } from "./Pagination.svelte";
export {
	paginationEllipsisRecipe,
	paginationNavRecipe,
	paginationPageRecipe,
	paginationRootRecipe,
} from "./recipe.js";
export type { PaginationComponentProps, PaginationSize } from "./types.js";

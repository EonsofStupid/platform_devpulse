/**
 * @file Pagination Component Barrel
 * @kind pagination
 * @layer components
 */

export { contract as paginationComponentContract } from "./contract.js";
export { default as Pagination } from "./Pagination.svelte";
export {
	paginationEllipsisComposition,
	paginationNavComposition,
	paginationPageComposition,
	paginationRootComposition,
} from "./composition.js";
export type { PaginationComponentProps, PaginationSize } from "./types.js";

/**
 * @file Pagination Primitive Barrel
 */

export { getPaginationContext, type PaginationContext, setPaginationContext } from "./context.js";
export { default as Pagination } from "./Pagination.svelte";
export { default as PaginationContent } from "./PaginationContent.svelte";
export { default as PaginationEllipsis } from "./PaginationEllipsis.svelte";
export { default as PaginationItem } from "./PaginationItem.svelte";
export { default as PaginationNext } from "./PaginationNext.svelte";
export { default as PaginationPrevious } from "./PaginationPrevious.svelte";
export type {
	PaginationContentProps,
	PaginationEllipsisProps,
	PaginationItemProps,
	PaginationNextProps,
	PaginationPreviousProps,
	PaginationProps,
} from "./types.js";

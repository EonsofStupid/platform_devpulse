/**
 * @file Pagination Primitive Barrel
 */
export { default as Pagination } from "./Pagination.svelte";
export { default as PaginationContent } from "./PaginationContent.svelte";
export { default as PaginationItem } from "./PaginationItem.svelte";
export { default as PaginationPrevious } from "./PaginationPrevious.svelte";
export { default as PaginationNext } from "./PaginationNext.svelte";
export { default as PaginationEllipsis } from "./PaginationEllipsis.svelte";
export type {
	PaginationProps,
	PaginationContentProps,
	PaginationItemProps,
	PaginationPreviousProps,
	PaginationNextProps,
	PaginationEllipsisProps,
} from "./types.js";
export { setPaginationContext, getPaginationContext, type PaginationContext } from "./context.js";

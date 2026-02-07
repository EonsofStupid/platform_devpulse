/**
 * @file Pagination Primitive Types
 * @description Structural type declarations for the pagination primitive.
 * Aligned to taxonomy contract: kind="pagination"
 * Slots: root, content, item, previous, next, ellipsis
 * ariaStateProvider: "meltui" — createPagination provides ARIA roles and keyboard nav.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Pagination root — navigation landmark container */
export interface PaginationProps extends OmitStyle<HTMLElement>, BaseProps {
	/** Current page (bindable) */
	page?: number;
	children?: Snippet;
}

/** Pagination content — container for page items and controls */
export interface PaginationContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Pagination item — individual page button */
export interface PaginationItemProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Pagination previous — button to go to previous page */
export interface PaginationPreviousProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Pagination next — button to go to next page */
export interface PaginationNextProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Pagination ellipsis — indicator for omitted page numbers */
export interface PaginationEllipsisProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

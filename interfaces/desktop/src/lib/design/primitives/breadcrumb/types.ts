/**
 * @file Breadcrumb Primitive Types
 * @description Structural type declarations for the breadcrumb primitive.
 * Aligned to taxonomy contract: kind="breadcrumb"
 * Slots: root, list, item, link, separator, page
 * ariaStateProvider: "coldlight" — semantic HTML landmarks + aria-current for current page indication.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Breadcrumb root — navigation landmark */
export interface BreadcrumbProps extends OmitStyle<HTMLElement>, BaseProps {
	children?: Snippet;
}

/** Breadcrumb list — ordered list of breadcrumb items */
export interface BreadcrumbListProps extends OmitStyle<HTMLOListElement>, BaseProps {
	children?: Snippet;
}

/** Breadcrumb item — list item wrapping a link or page indicator */
export interface BreadcrumbItemProps extends OmitStyle<HTMLLIElement>, BaseProps {
	children?: Snippet;
}

/** Breadcrumb link — navigation link to a parent page */
export interface BreadcrumbLinkProps extends OmitStyle<HTMLAnchorElement>, BaseProps {
	children?: Snippet;
}

/** Breadcrumb separator — visual separator between items */
export interface BreadcrumbSeparatorProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

/** Breadcrumb page — current page indicator (non-link) */
export interface BreadcrumbPageProps extends OmitStyle<HTMLSpanElement>, BaseProps {
	children?: Snippet;
}

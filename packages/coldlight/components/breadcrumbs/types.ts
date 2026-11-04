/**
 * @file Breadcrumbs Component Types
 * @kind breadcrumbs
 * @layer components
 *
 * Reference: WAI-ARIA APG Breadcrumb Pattern
 */

import type { Snippet } from "svelte";
import type { HTMLAnchorAttributes, HTMLAttributes } from "svelte/elements";
import type { BreadcrumbsSize } from "./breadcrumbs.generated.js";

export type { BreadcrumbsSize } from "./breadcrumbs.generated.js";

export interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
	/** Accessible label for the breadcrumb navigation. */
	label?: string;
	/** Separator character between items. @default "/" */
	separator?: string;
	/** Size variant */
	size?: BreadcrumbsSize;
}

export interface BreadcrumbsListProps extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface BreadcrumbsItemProps extends Omit<HTMLAttributes<HTMLLIElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface BreadcrumbsLinkProps extends Omit<HTMLAnchorAttributes, "children"> {
	children?: Snippet;
	class?: string;
}

export interface BreadcrumbsPageProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface BreadcrumbsSeparatorProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
	/** Replaces the root's separator character for this item. */
	children?: Snippet;
	class?: string;
}

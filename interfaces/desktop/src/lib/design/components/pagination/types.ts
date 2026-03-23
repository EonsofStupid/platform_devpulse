/**
 * @file Pagination Component Types
 * @kind pagination
 * @layer components
 *
 * Extends primitive with sizing, page state, and callback props.
 * ColdLight-owned component — no external builder dependency.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type PaginationSize = "sm" | "md" | "lg";

/** Pagination component props — ColdLight 8-axis + ARIA + composition + primitive */
export interface PaginationComponentProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Current active page (1-indexed). @default 1 */
	page?: number;
	/** Total number of pages */
	totalPages: number;
	/** Callback when page changes */
	onPageChange?: (page: number) => void;
	/** Number of sibling pages shown on each side of the current page. @default 1 */
	siblings?: number;
	/** Number of boundary pages shown at start and end. @default 1 */
	boundaries?: number;
	/** Size variant */
	size?: PaginationSize;
}

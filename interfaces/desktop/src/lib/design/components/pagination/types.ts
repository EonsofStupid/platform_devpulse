/**
 * @file Pagination Component Types
 * @kind pagination
 * @layer components
 *
 * Extends PaginationPrimitiveProps with visual preset and sizing.
 */

import type { PaginationPrimitiveProps } from "$lib/design/behaviors/navigation/pagination/index.js";

export type PaginationSize = "sm" | "md" | "lg";
export type PaginationPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** Pagination component props — primitive + ColdLight visual */
export interface PaginationComponentProps extends PaginationPrimitiveProps {
	/** Style preset. Default: "default". */
	preset?: PaginationPreset;
	/** Total number of pages */
	totalPages: number;
	/** Number of sibling pages shown on each side of the current page. @default 1 */
	siblings?: number;
	/** Number of boundary pages shown at start and end. @default 1 */
	boundaries?: number;
	/** Size variant */
	size?: PaginationSize;
}

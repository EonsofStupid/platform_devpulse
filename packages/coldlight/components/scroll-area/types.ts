/**
 * @file ScrollArea Component Types
 * @kind scroll-area
 * @layer components
 *
 * Extends ScrollAreaPrimitiveProps with visual preset and sizing.
 */

import type { ScrollAreaPrimitiveProps } from "#coldlight/behaviors/interaction/scroll-area/index.js";

export type ScrollAreaSize = "sm" | "md" | "lg";
export type ScrollAreaOrientation = "horizontal" | "vertical";
export type ScrollAreaPreset = "default" | "stark" | "glass" | "flat" | "matte";

/** ScrollArea component props — primitive + ColdLight visual */
export interface ScrollAreaComponentProps extends ScrollAreaPrimitiveProps {
	/** Style preset. Default: "default". */
	preset?: ScrollAreaPreset;
	/** Size variant — controls scrollbar thumb size. @default "md" */
	size?: ScrollAreaSize;
	/** Accessible label for the scroll region. */
	label?: string;
}

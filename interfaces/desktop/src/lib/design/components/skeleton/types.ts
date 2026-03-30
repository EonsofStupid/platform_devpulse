/**
 * @file Skeleton Types
 * @kind skeleton
 * @layer components
 */

import type { SkeletonPrimitiveProps } from "$lib/design/primitives/skeleton/index.js";

export type SkeletonVariant = "text" | "circular" | "rectangular";

export type SkeletonPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface SkeletonProps extends SkeletonPrimitiveProps {
	loading?: boolean;
	variant?: SkeletonVariant;
	/** Style preset. Default: "default". */
	preset?: SkeletonPreset;
}

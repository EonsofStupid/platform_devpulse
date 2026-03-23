/**
 * @file Skeleton Types
 * @kind skeleton
 * @layer components
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class">,
		ComponentProps {
	loading?: boolean;
	variant?: SkeletonVariant;
}

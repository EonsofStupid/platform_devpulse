/**
 * @file Skeleton Types
 * @kind skeleton
 * @layer components
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style">,
		BaseProps,
		ComponentProps {
	loading?: boolean;
	onLoadingChange?: (loading: boolean) => void;
	variant?: SkeletonVariant;
}

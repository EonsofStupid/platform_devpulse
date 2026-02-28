/**
 * @file Skeleton Recipe
 * @kind skeleton
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type SkeletonRecipeProps = { variant?: string };

export function skeletonRecipe(props: SkeletonRecipeProps = {}): string {
	return cn(
		"animate-pulse rounded-md",
		"bg-[oklch(1_0_0/0.06)]",
	);
}

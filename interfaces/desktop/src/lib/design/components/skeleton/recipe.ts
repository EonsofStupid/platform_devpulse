/**
 * @file Skeleton Recipe
 * @kind skeleton
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Skeleton: animated loading placeholder with shape variants.
 */

import type { SkeletonVariant } from "./types.js";

const base = [
	"animate-pulse",
	"bg-surface-muted",
].join(" ");

const variantStyles: Record<SkeletonVariant, string> = {
	text: "h-4 w-full rounded",
	circular: "rounded-full",
	rectangular: "rounded-md",
};

export function skeletonRecipe(opts: { variant: SkeletonVariant }): string {
	return `${base} ${variantStyles[opts.variant]}`;
}

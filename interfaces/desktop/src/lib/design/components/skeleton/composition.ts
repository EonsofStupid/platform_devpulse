/**
 * @file Skeleton Composition — Shortcode Composition
 * @kind skeleton
 * @layer components
 *
 * GOLD STANDARD — structural classes only.
 * NO raw Tailwind utilities in composition output.
 *
 * Structural class (skeleton-root) handles animation and background.
 */

type SkeletonRecipeProps = { variant?: string };

export function skeletonComposition(_props: SkeletonRecipeProps = {}): string {
	return "skeleton-root";
}

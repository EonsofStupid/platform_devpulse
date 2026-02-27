/**
 * @file VisuallyHidden Recipe
 * @kind visually-hidden
 * @layer components
 *
 * Screen-reader-only CSS pattern. Hides content visually while
 * keeping it in the accessibility tree.
 */

const base = "sr-only";

export function visuallyHiddenRecipe(): string {
	return base;
}

/**
 * @file Sticky Recipe
 * @kind sticky
 * @layer components
 *
 * Shortcode composition — structural class only.
 * Layout handled by sticky-root @utility.
 */

type StickyRecipeProps = { top?: string; offset?: string };

export function stickyRecipe(_props: StickyRecipeProps = {}): string {
	return "sticky-root";
}

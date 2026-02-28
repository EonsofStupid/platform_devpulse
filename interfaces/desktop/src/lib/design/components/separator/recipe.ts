/**
 * @file Separator Recipe — Shortcode Composition
 * @kind separator
 * @layer components
 *
 * GOLD STANDARD — structural classes only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Purely structural component. Orientation is handled via
 * data-orientation attribute in the CSS @utility.
 */

type SeparatorRecipeProps = { orientation?: string; variant?: string };

export function separatorRecipe(props: SeparatorRecipeProps = {}): string {
	return "separator-root";
}

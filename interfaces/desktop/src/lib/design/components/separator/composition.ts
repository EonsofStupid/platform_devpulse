/**
 * @file Separator Composition — Shortcode Composition
 * @kind separator
 * @layer components
 *
 * GOLD STANDARD — structural classes only.
 * NO raw Tailwind utilities in composition output.
 *
 * Purely structural component. Orientation is handled via
 * data-orientation attribute in the CSS @utility.
 */

type SeparatorRecipeProps = { orientation?: string; variant?: string };

export function separatorComposition(_props: SeparatorRecipeProps = {}): string {
	return "separator-root";
}

/**
 * @file Center Recipe — Shortcode Class Composition
 * @kind layout
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (center-block, center-inline) handle layout
 *   - NO raw Tailwind utilities in recipe output
 */

type CenterRecipeProps = { inline?: boolean };

export function centerRecipe(props: CenterRecipeProps = {}): string {
	return props.inline ? "center-inline" : "center-block";
}

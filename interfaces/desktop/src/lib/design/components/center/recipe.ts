/**
 * @file Center Recipe
 * @kind center
 * @layer components
 *
 * Centering recipe — flex centering via Tailwind classes.
 */

export function centerRecipe(opts: { inline?: boolean }): string {
	const display = opts.inline ? "inline-flex" : "flex";
	return `${display} items-center justify-center`;
}

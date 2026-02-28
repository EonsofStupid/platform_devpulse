/**
 * @file Stack Recipe
 * @kind stack
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by stack-root @utility + stack-gap-* / stack-align-* classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type StackRecipeProps = { gap?: string; align?: string };

export function stackRecipe(props: StackRecipeProps = {}): string {
	const gap = `stack-gap-${props.gap ?? "4"}`;
	const align = `stack-align-${props.align ?? "stretch"}`;
	return cn("stack-root", gap, align);
}

/**
 * @file HStack Recipe
 * @kind hstack
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by hstack-root @utility + hstack-gap-* / hstack-align-* classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type HStackRecipeProps = { gap?: string; align?: string; justify?: string };

export function hstackRecipe(props: HStackRecipeProps = {}): string {
	const gap = `hstack-gap-${props.gap ?? "2"}`;
	const align = `hstack-align-${props.align ?? "center"}`;
	const justify = props.justify ? `hstack-justify-${props.justify}` : "";
	return cn("hstack-root", gap, align, justify);
}

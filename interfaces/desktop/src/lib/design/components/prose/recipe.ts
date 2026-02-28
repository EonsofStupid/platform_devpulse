/**
 * @file Prose Recipe — Shortcode Composition
 * @kind prose
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural class (prose-root) handles typography and nested elements.
 * Size is controlled by sz-* shortcode classes which set --recipe-font-size
 * consumed by prose-root.
 */

import { cn } from "$lib/design/utils/cn.js";

type ProseRecipeProps = { size?: string };

export function proseRecipe(props: ProseRecipeProps = {}): string {
	const size = props.size === "sm" ? "sz-sm" : props.size === "lg" ? "sz-lg" : "sz-md";
	return cn(
		"prose-root",
		size,
	);
}

/**
 * @file TableOfContents Recipe
 * @kind table-of-contents
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by toc-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TableOfContentsRecipeProps = { size?: string };

export function tableOfContentsRecipe(props: TableOfContentsRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"toc-root",
		sizeMap[props.size ?? "md"] ?? "sz-md",
	);
}

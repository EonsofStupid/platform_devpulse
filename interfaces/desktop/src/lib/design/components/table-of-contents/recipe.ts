/**
 * @file TableOfContents Recipe — Structural Classes Only
 * @kind table-of-contents
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TableOfContentsRecipeProps = { size?: string };

export function tableOfContentsRecipe(props: TableOfContentsRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};
	return cn("toc-root", sizeMap[props.size ?? "md"] ?? "text-sm");
}

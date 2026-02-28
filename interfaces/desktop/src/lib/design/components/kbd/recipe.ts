/**
 * @file Kbd Recipe
 * @kind kbd
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by kbd-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type KbdRecipeProps = { size?: string };

export function kbdRecipe(props: KbdRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn("kbd-root", sizeMap[props.size ?? "md"] ?? "sz-md");
}

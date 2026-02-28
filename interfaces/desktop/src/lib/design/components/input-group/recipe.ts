/**
 * @file InputGroup Recipe
 * @kind input-group
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by input-group-* @utility classes. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type InputGroupRecipeProps = { size?: string };

export function inputGroupRecipe(props: InputGroupRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"input-group-root",
		"v-void s-glass e-0",
		sizeMap[props.size ?? "md"] ?? "sz-md",
		"rounded-md",
	);
}

export function inputGroupPrefixRecipe(props: InputGroupRecipeProps = {}): string {
	return cn("input-group-prefix");
}

export function inputGroupInputRecipe(): string {
	return cn("input-group-input");
}

export function inputGroupSuffixRecipe(props: InputGroupRecipeProps = {}): string {
	return cn("input-group-suffix");
}

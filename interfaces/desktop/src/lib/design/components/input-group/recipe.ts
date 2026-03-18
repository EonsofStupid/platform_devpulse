/**
 * @file InputGroup Recipe — Structural Classes Only
 * @kind input-group
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type InputGroupRecipeProps = { size?: string };

export function inputGroupRecipe(props: InputGroupRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "h-8 px-3 text-sm",
		md: "h-10 px-4 text-sm",
		lg: "h-12 px-6 text-base",
	};
	return cn("input-group-root", sizeMap[props.size ?? "md"] ?? "h-10 px-4 text-sm", "rounded-md");
}

export function inputGroupPrefixRecipe(_props: InputGroupRecipeProps = {}): string {
	return cn("input-group-prefix");
}

export function inputGroupInputRecipe(): string {
	return cn("input-group-input");
}

export function inputGroupSuffixRecipe(_props: InputGroupRecipeProps = {}): string {
	return cn("input-group-suffix");
}

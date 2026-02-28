/**
 * @file Form Recipe
 * @kind form
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural class: form-root
 * Size intent classes: form-{size}
 */

import { cn } from "$lib/design/utils/cn.js";

type FormRecipeProps = { size?: string };

export function formRecipe(props: FormRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "form-sm",
		md: "form-md",
		lg: "form-lg",
	};
	return cn(
		"form-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}

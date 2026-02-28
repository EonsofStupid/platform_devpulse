/**
 * @file Stack Recipe
 * @kind stack
 * @layer components
 *
 * Props → standard Tailwind v4 utility classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type StackRecipeProps = { gap?: string; align?: string };

export function stackRecipe(props: StackRecipeProps = {}): string {
	const gap = `gap-${props.gap ?? "4"}`;
	const alignMap: Record<string, string> = {
		stretch: "items-stretch",
		start: "items-start",
		center: "items-center",
		end: "items-end",
	};
	const align = alignMap[props.align ?? "stretch"] ?? "items-stretch";
	return cn("flex", "flex-col", gap, align);
}

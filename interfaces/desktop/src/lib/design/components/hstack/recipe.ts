/**
 * @file HStack Recipe
 * @kind hstack
 * @layer components
 *
 * Props → standard Tailwind v4 utility classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type HStackRecipeProps = { gap?: string; align?: string; justify?: string };

export function hstackRecipe(props: HStackRecipeProps = {}): string {
	const gap = `gap-${props.gap ?? "2"}`;
	const alignMap: Record<string, string> = {
		center: "items-center",
		start: "items-start",
		end: "items-end",
		baseline: "items-baseline",
		stretch: "items-stretch",
	};
	const justifyMap: Record<string, string> = {
		start: "justify-start",
		end: "justify-end",
		center: "justify-center",
		between: "justify-between",
		around: "justify-around",
		evenly: "justify-evenly",
	};
	const align = alignMap[props.align ?? "center"] ?? "items-center";
	const justify = props.justify ? (justifyMap[props.justify] ?? "") : "";
	return cn("flex", "flex-row", gap, align, justify);
}

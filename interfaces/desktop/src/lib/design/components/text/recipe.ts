/**
 * @file Text Recipe
 * @kind text
 * @layer components
 *
 * Props → standard Tailwind v4 utility classes.
 * Colors map to @theme --color-text-* tokens.
 * Sizes map to @theme --font-size-* tokens.
 */

import { cn } from "$lib/design/utils/cn.js";

type TextRecipeProps = { size?: string; weight?: string; color?: string };

export function textRecipe(props: TextRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		xs: "text-xs",
		sm: "text-sm",
		md: "text-base",
		base: "text-base",
		lg: "text-lg",
		xl: "text-xl",
		"2xl": "text-2xl",
	};
	const weightMap: Record<string, string> = {
		normal: "font-normal",
		medium: "font-medium",
		semibold: "font-semibold",
		bold: "font-bold",
	};
	const colorMap: Record<string, string> = {
		primary: "text-text-primary",
		secondary: "text-text-secondary",
		muted: "text-text-muted",
		inverted: "text-text-inverted",
		link: "text-text-link",
		error: "text-text-error",
		success: "text-text-success",
	};
	const size = sizeMap[props.size ?? "base"] ?? "text-base";
	const weight = weightMap[props.weight ?? "normal"] ?? "font-normal";
	const color = colorMap[props.color ?? "primary"] ?? "text-text-primary";
	return cn(size, weight, color);
}

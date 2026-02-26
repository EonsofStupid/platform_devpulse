/**
 * @file Text Recipe
 * @kind text
 * @layer components
 *
 * Typography text recipe — size, weight, color via Tailwind classes.
 */

import type { TextSize, TextWeight, TextColor } from "./types.js";

const sizeStyles: Record<TextSize, string> = {
	xs: "text-xs",
	sm: "text-sm",
	base: "text-base",
	lg: "text-lg",
	xl: "text-xl",
	"2xl": "text-2xl",
};

const weightStyles: Record<TextWeight, string> = {
	normal: "font-normal",
	medium: "font-medium",
	semibold: "font-semibold",
	bold: "font-bold",
};

const colorStyles: Record<TextColor, string> = {
	default: "text-text-primary",
	muted: "text-text-secondary",
	accent: "text-teal-300",
	inherit: "text-inherit",
};

export function textRecipe(opts: {
	size?: TextSize;
	weight?: TextWeight;
	color?: TextColor;
}): string {
	const parts: string[] = [];
	parts.push(sizeStyles[opts.size ?? "base"]);
	parts.push(weightStyles[opts.weight ?? "normal"]);
	parts.push(colorStyles[opts.color ?? "default"]);
	return parts.join(" ");
}

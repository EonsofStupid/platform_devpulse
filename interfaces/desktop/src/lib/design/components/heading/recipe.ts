/**
 * @file Heading Recipe
 * @kind heading
 * @layer components
 *
 * Heading typography recipe — size via Tailwind classes.
 * Visual size is decoupled from semantic level.
 */

import type { HeadingSize } from "./types.js";

const base = "font-bold tracking-tight text-text-primary";

const sizeStyles: Record<HeadingSize, string> = {
	xs: "text-sm",
	sm: "text-base",
	md: "text-lg",
	lg: "text-xl",
	xl: "text-2xl",
	"2xl": "text-3xl",
	"3xl": "text-4xl",
	"4xl": "text-5xl",
};

export function headingRecipe(opts: { size?: HeadingSize }): string {
	return `${base} ${sizeStyles[opts.size ?? "lg"]}`;
}

/**
 * @file Box Recipe
 * @kind box
 * @layer components
 *
 * Minimal layout recipe — padding and border-radius via Tailwind classes.
 */

import type { BoxPadding, BoxRadius } from "./types.js";

const paddingStyles: Record<BoxPadding, string> = {
	none: "",
	sm: "p-2",
	md: "p-4",
	lg: "p-6",
	xl: "p-8",
};

const radiusStyles: Record<BoxRadius, string> = {
	none: "",
	sm: "rounded-sm",
	md: "rounded-md",
	lg: "rounded-lg",
	full: "rounded-full",
};

export function boxRecipe(opts: { padding?: BoxPadding; radius?: BoxRadius }): string {
	const parts: string[] = [];
	if (opts.padding && opts.padding !== "none") parts.push(paddingStyles[opts.padding]);
	if (opts.radius && opts.radius !== "none") parts.push(radiusStyles[opts.radius]);
	return parts.join(" ");
}

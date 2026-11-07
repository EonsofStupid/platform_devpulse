/**
 * @file Nav Recipe
 * @kind nav
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { NavSize, NavOrientation } from "./types.js";

const base = [
	"flex gap-1",
	"rounded-md",
].join(" ");

const sizeStyles: Record<NavSize, string> = {
	sm: "text-sm gap-0.5",
	md: "text-base gap-1",
	lg: "text-lg gap-2",
};

const orientationStyles: Record<NavOrientation, string> = {
	horizontal: "flex-row items-center",
	vertical: "flex-col items-stretch",
};

export function navRecipe(opts: { size: NavSize; orientation: NavOrientation }): string {
	return `${base} ${sizeStyles[opts.size]} ${orientationStyles[opts.orientation]}`;
}

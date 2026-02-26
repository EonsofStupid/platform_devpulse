/**
 * @file Spinner Recipe
 * @kind spinner
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Spinner: animated circular loading indicator with size variants.
 */

import type { SpinnerSize } from "./types.js";

const base = [
	"inline-block rounded-full",
	"border-2 border-current border-t-transparent",
	"animate-spin",
].join(" ");

const sizeStyles: Record<SpinnerSize, string> = {
	sm: "h-4 w-4",
	md: "h-6 w-6",
	lg: "h-8 w-8",
};

export function spinnerRecipe(opts: { size: SpinnerSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

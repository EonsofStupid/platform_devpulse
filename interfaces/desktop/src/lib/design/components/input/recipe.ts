/**
 * @file Input Recipe
 * @kind input
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 *
 * Input field: border, background, focus ring, sizes, placeholder style.
 */

import type { InputSize } from "./types.js";

const base = [
	"flex w-full rounded-md border",
	"bg-surface-primary text-text-primary",
	"border-border-subtle",
	"placeholder:text-text-muted",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:border-border-focus",
	"disabled:pointer-events-none disabled:opacity-50",
	"read-only:opacity-70",
	"aria-[invalid=true]:border-ember-500 aria-[invalid=true]:focus-visible:ring-ember-500",
].join(" ");

const sizeStyles: Record<InputSize, string> = {
	sm: "h-8 px-2 text-sm",
	md: "h-10 px-3 text-base",
	lg: "h-12 px-4 text-lg",
};

export function inputRecipe(opts: { size: InputSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

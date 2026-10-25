/**
 * @file Textarea Recipe
 * @kind textarea
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { TextareaSize } from "./types.js";

const base = [
	"block w-full rounded-md border font-normal",
	"bg-surface-primary text-text-primary",
	"border-border-subtle",
	"placeholder:text-text-muted",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:pointer-events-none disabled:opacity-50",
	"resize-y",
].join(" ");

const sizeStyles: Record<TextareaSize, string> = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-base",
	lg: "px-4 py-3 text-lg",
};

export function textareaRecipe(opts: { size: TextareaSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

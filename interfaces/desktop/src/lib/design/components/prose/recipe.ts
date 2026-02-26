/**
 * @file Prose Recipe
 * @kind prose
 * @layer components
 *
 * Prose styling recipe — typographic styling for rich text content.
 * Uses Tailwind's prose utilities for markdown-friendly typography.
 */

import type { ProseSize } from "./types.js";

const base = [
	"prose prose-invert",
	"prose-headings:text-text-primary",
	"prose-p:text-text-secondary",
	"prose-a:text-teal-300 prose-a:no-underline hover:prose-a:underline",
	"prose-strong:text-text-primary",
	"prose-code:text-teal-200",
	"max-w-none",
].join(" ");

const sizeStyles: Record<ProseSize, string> = {
	sm: "prose-sm",
	base: "prose-base",
	lg: "prose-lg",
};

export function proseRecipe(opts: { size?: ProseSize }): string {
	return `${base} ${sizeStyles[opts.size ?? "base"]}`;
}

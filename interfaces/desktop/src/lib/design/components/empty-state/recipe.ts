/**
 * @file EmptyState Recipe
 * @kind empty-state
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * EmptyState: centered placeholder for empty content areas with icon, title, description, and CTA.
 */

import type { EmptyStateSize } from "./types.js";

const base = [
	"flex flex-col items-center justify-center",
	"text-center",
	"text-text-secondary",
].join(" ");

const sizeStyles: Record<EmptyStateSize, string> = {
	sm: "gap-2 p-6 text-sm",
	md: "gap-3 p-8 text-base",
	lg: "gap-4 p-12 text-lg",
};

export function emptyStateRecipe(opts: { size: EmptyStateSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

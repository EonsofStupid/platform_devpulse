/**
 * @file SkipLink Recipe
 * @kind skip-link
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Visually hidden by default, visible on focus.
 */

const base = [
	"sr-only focus:not-sr-only",
	"fixed top-2 left-2 z-50",
	"inline-flex items-center justify-center",
	"rounded-md px-4 py-2",
	"bg-surface-primary text-text-primary",
	"border border-border-subtle",
	"font-medium text-sm",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"transition-opacity duration-fast",
].join(" ");

export function skipLinkRecipe(): string {
	return base;
}

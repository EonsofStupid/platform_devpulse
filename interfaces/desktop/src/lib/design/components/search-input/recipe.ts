/**
 * @file Search Input Recipe
 * @kind search-input
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { SearchInputSize } from "./types.js";

const base = [
	"inline-flex items-center gap-2",
	"rounded-md border",
	"bg-surface-primary text-text-primary",
	"border-border-subtle",
	"transition-colors duration-fast",
	"focus-within:ring-2 focus-within:ring-border-focus",
	"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
].join(" ");

const inputBase = [
	"flex-1 bg-transparent text-text-primary",
	"border-none outline-none",
	"placeholder:text-text-muted",
].join(" ");

const iconBase = [
	"flex-shrink-0 text-text-muted",
].join(" ");

const clearBase = [
	"inline-flex items-center justify-center flex-shrink-0",
	"rounded-sm text-text-muted",
	"hover:text-text-primary hover:bg-surface-elevated",
	"transition-colors duration-fast",
	"aria-disabled:pointer-events-none aria-disabled:opacity-0",
	"data-[visible]:opacity-100 opacity-0",
].join(" ");

const sizeStyles: Record<SearchInputSize, string> = {
	sm: "h-8 px-2 text-sm",
	md: "h-10 px-3 text-base",
	lg: "h-12 px-4 text-lg",
};

const iconSizeStyles: Record<SearchInputSize, string> = {
	sm: "w-4 h-4",
	md: "w-5 h-5",
	lg: "w-6 h-6",
};

const clearSizeStyles: Record<SearchInputSize, string> = {
	sm: "w-5 h-5",
	md: "w-6 h-6",
	lg: "w-7 h-7",
};

export function searchInputRecipe(opts: { size: SearchInputSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

export function searchInputInputRecipe(): string {
	return inputBase;
}

export function searchInputIconRecipe(opts: { size: SearchInputSize }): string {
	return `${iconBase} ${iconSizeStyles[opts.size]}`;
}

export function searchInputClearRecipe(opts: { size: SearchInputSize }): string {
	return `${clearBase} ${clearSizeStyles[opts.size]}`;
}

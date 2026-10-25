/**
 * @file Pagination Recipe
 * @kind pagination
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { PaginationSize } from "./types.js";

// Root container
const rootBase = "flex items-center gap-1";

// Page button base styles
const pageBase = [
	"inline-flex items-center justify-center",
	"rounded-md font-medium",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:pointer-events-none disabled:opacity-50",
	"bg-transparent text-text-secondary border border-transparent",
	"hover:bg-surface-elevated hover:text-text-primary",
].join(" ");

// Active page style
const pageActiveBase = [
	"bg-surface-primary text-text-primary border-border-subtle",
].join(" ");

// Nav button (prev/next) styles
const navBase = [
	"inline-flex items-center justify-center",
	"rounded-md font-medium",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:pointer-events-none disabled:opacity-50",
	"bg-transparent text-text-secondary",
	"hover:bg-surface-elevated hover:text-text-primary",
].join(" ");

// Ellipsis styles
const ellipsisBase = "inline-flex items-center justify-center text-text-muted select-none";

const pageSizeStyles: Record<PaginationSize, string> = {
	sm: "h-8 min-w-8 px-2 text-sm",
	md: "h-10 min-w-10 px-3 text-base",
	lg: "h-12 min-w-12 px-4 text-lg",
};

const navSizeStyles: Record<PaginationSize, string> = {
	sm: "h-8 w-8 text-sm",
	md: "h-10 w-10 text-base",
	lg: "h-12 w-12 text-lg",
};

const ellipsisSizeStyles: Record<PaginationSize, string> = {
	sm: "h-8 w-8 text-sm",
	md: "h-10 w-10 text-base",
	lg: "h-12 w-12 text-lg",
};

export function paginationRootRecipe(): string {
	return rootBase;
}

export function paginationPageRecipe(opts: { size: PaginationSize; active?: boolean }): string {
	const sizeClass = pageSizeStyles[opts.size];
	return opts.active
		? `${pageBase} ${pageActiveBase} ${sizeClass}`
		: `${pageBase} ${sizeClass}`;
}

export function paginationNavRecipe(opts: { size: PaginationSize }): string {
	return `${navBase} ${navSizeStyles[opts.size]}`;
}

export function paginationEllipsisRecipe(opts: { size: PaginationSize }): string {
	return `${ellipsisBase} ${ellipsisSizeStyles[opts.size]}`;
}

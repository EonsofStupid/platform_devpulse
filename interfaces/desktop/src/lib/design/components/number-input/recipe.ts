/**
 * @file Number Input Recipe
 * @kind number-input
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { NumberInputSize } from "./types.js";

const base = [
	"inline-flex items-center",
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
	"tabular-nums text-center",
	"placeholder:text-text-muted",
].join(" ");

const buttonBase = [
	"inline-flex items-center justify-center",
	"bg-transparent text-text-secondary",
	"border-l border-border-subtle",
	"hover:bg-surface-elevated hover:text-text-primary",
	"active:bg-surface-muted",
	"transition-colors duration-fast",
	"aria-disabled:pointer-events-none aria-disabled:opacity-40",
].join(" ");

const sizeStyles: Record<NumberInputSize, string> = {
	sm: "h-8 text-sm",
	md: "h-10 text-base",
	lg: "h-12 text-lg",
};

const inputSizeStyles: Record<NumberInputSize, string> = {
	sm: "px-2 text-sm",
	md: "px-3 text-base",
	lg: "px-4 text-lg",
};

const buttonSizeStyles: Record<NumberInputSize, string> = {
	sm: "w-7 text-xs",
	md: "w-9 text-sm",
	lg: "w-11 text-base",
};

export function numberInputRecipe(opts: { size: NumberInputSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

export function numberInputInputRecipe(opts: { size: NumberInputSize }): string {
	return `${inputBase} ${inputSizeStyles[opts.size]}`;
}

export function numberInputButtonRecipe(opts: { size: NumberInputSize }): string {
	return `${buttonBase} ${buttonSizeStyles[opts.size]}`;
}

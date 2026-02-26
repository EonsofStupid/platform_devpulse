/**
 * @file Input Group Recipe
 * @kind input-group
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { InputGroupSize } from "./types.js";

const base = [
	"inline-flex items-stretch",
	"rounded-md border",
	"bg-surface-primary text-text-primary",
	"border-border-subtle",
	"transition-colors duration-fast",
	"focus-within:ring-2 focus-within:ring-border-focus",
	"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
].join(" ");

const prefixBase = [
	"inline-flex items-center",
	"bg-surface-muted text-text-secondary",
	"border-r border-border-subtle",
].join(" ");

const inputSlotBase = [
	"flex-1 min-w-0",
].join(" ");

const suffixBase = [
	"inline-flex items-center",
	"bg-surface-muted text-text-secondary",
	"border-l border-border-subtle",
].join(" ");

const sizeStyles: Record<InputGroupSize, string> = {
	sm: "h-8 text-sm",
	md: "h-10 text-base",
	lg: "h-12 text-lg",
};

const addonSizeStyles: Record<InputGroupSize, string> = {
	sm: "px-2 text-sm",
	md: "px-3 text-base",
	lg: "px-4 text-lg",
};

export function inputGroupRecipe(opts: { size: InputGroupSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

export function inputGroupPrefixRecipe(opts: { size: InputGroupSize }): string {
	return `${prefixBase} ${addonSizeStyles[opts.size]}`;
}

export function inputGroupInputRecipe(): string {
	return inputSlotBase;
}

export function inputGroupSuffixRecipe(opts: { size: InputGroupSize }): string {
	return `${suffixBase} ${addonSizeStyles[opts.size]}`;
}

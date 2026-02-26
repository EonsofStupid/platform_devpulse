/**
 * @file Color Input Recipe
 * @kind color-input
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { ColorInputSize } from "./types.js";

const base = [
	"inline-flex items-center gap-2",
	"rounded-md border",
	"bg-surface-primary text-text-primary",
	"border-border-subtle",
	"transition-colors duration-fast",
	"focus-within:ring-2 focus-within:ring-border-focus",
	"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
	"data-[invalid]:border-ember-500",
].join(" ");

const swatchBase = [
	"rounded-sm border border-border-subtle",
	"flex-shrink-0",
].join(" ");

const inputBase = [
	"sr-only",
].join(" ");

const labelBase = [
	"text-text-primary cursor-pointer",
	"data-[disabled]:cursor-default data-[disabled]:text-text-muted",
].join(" ");

const sizeStyles: Record<ColorInputSize, string> = {
	sm: "h-8 px-2 text-sm",
	md: "h-10 px-3 text-base",
	lg: "h-12 px-4 text-lg",
};

const swatchSizeStyles: Record<ColorInputSize, string> = {
	sm: "w-5 h-5",
	md: "w-6 h-6",
	lg: "w-8 h-8",
};

const labelSizeStyles: Record<ColorInputSize, string> = {
	sm: "text-sm",
	md: "text-base",
	lg: "text-lg",
};

export function colorInputRecipe(opts: { size: ColorInputSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

export function colorInputSwatchRecipe(opts: { size: ColorInputSize }): string {
	return `${swatchBase} ${swatchSizeStyles[opts.size]}`;
}

export function colorInputInputRecipe(): string {
	return inputBase;
}

export function colorInputLabelRecipe(opts: { size: ColorInputSize }): string {
	return `${labelBase} ${labelSizeStyles[opts.size]}`;
}

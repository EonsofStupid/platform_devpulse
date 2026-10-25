/**
 * @file Switch Recipe
 * @kind switch
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 *
 * Switch track + thumb: width, height, thumb translate on checked.
 */

import type { SwitchSize } from "./types.js";

const base = [
	"inline-flex items-center shrink-0 cursor-pointer",
	"rounded-full border-2 border-transparent",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
	"disabled:pointer-events-none disabled:opacity-50",
	"bg-surface-muted",
	"data-[state=checked]:bg-surface-primary",
].join(" ");

const sizeStyles: Record<SwitchSize, string> = {
	sm: "h-5 w-9",
	md: "h-6 w-11",
	lg: "h-7 w-14",
};

export function switchRecipe(opts: { size: SwitchSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

// Thumb recipe — separated for composability
const thumbBase = [
	"pointer-events-none block rounded-full bg-text-primary",
	"shadow-sm transition-transform duration-fast",
].join(" ");

const thumbSizeStyles: Record<SwitchSize, { unchecked: string; checked: string }> = {
	sm: { unchecked: "h-4 w-4 translate-x-0", checked: "h-4 w-4 translate-x-4" },
	md: { unchecked: "h-5 w-5 translate-x-0", checked: "h-5 w-5 translate-x-5" },
	lg: { unchecked: "h-6 w-6 translate-x-0", checked: "h-6 w-6 translate-x-7" },
};

export function switchThumbRecipe(opts: { size: SwitchSize; checked: boolean }): string {
	const sizeStyle = thumbSizeStyles[opts.size];
	return `${thumbBase} ${opts.checked ? sizeStyle.checked : sizeStyle.unchecked}`;
}

/**
 * @file Card Recipe
 * @kind card
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { CardSize, CardVariant } from "./types.js";

const base = [
	"flex flex-col",
	"rounded-lg",
	"overflow-hidden",
].join(" ");

const variantStyles: Record<CardVariant, string> = {
	default: [
		"bg-surface-primary",
		"border border-border-subtle",
	].join(" "),
	outlined: [
		"bg-transparent",
		"border border-border-subtle",
	].join(" "),
	elevated: [
		"bg-surface-elevated",
		"border border-border-subtle",
		"shadow-md",
	].join(" "),
	ghost: [
		"bg-transparent",
		"border-transparent",
	].join(" "),
};

const sizeStyles: Record<CardSize, string> = {
	sm: "p-3 gap-2 text-sm",
	md: "p-4 gap-3 text-base",
	lg: "p-6 gap-4 text-lg",
};

export function cardRecipe(opts: { variant: CardVariant; size: CardSize }): string {
	return `${base} ${variantStyles[opts.variant]} ${sizeStyles[opts.size]}`;
}

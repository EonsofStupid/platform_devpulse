/**
 * @file Checkbox Recipe
 * @kind checkbox
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { CheckboxIntent, CheckboxSize } from "./types.js";

const base = [
	"inline-flex items-center justify-center shrink-0",
	"rounded-sm border-2",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
	"disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const intentStyles: Record<CheckboxIntent, string> = {
	default: [
		"border-border-subtle bg-transparent",
		"data-[state=checked]:bg-surface-primary data-[state=checked]:border-border-focus data-[state=checked]:text-text-primary",
		"data-[state=indeterminate]:bg-surface-primary data-[state=indeterminate]:border-border-focus data-[state=indeterminate]:text-text-primary",
		"hover:border-border-focus",
	].join(" "),
};

const sizeStyles: Record<CheckboxSize, string> = {
	sm: "h-4 w-4",
	md: "h-5 w-5",
	lg: "h-6 w-6",
};

export function checkboxRecipe(opts: { intent: CheckboxIntent; size: CheckboxSize }): string {
	return `${base} ${intentStyles[opts.intent]} ${sizeStyles[opts.size]}`;
}

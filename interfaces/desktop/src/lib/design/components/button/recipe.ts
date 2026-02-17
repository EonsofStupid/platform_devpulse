/**
 * @file Button Recipe
 * @kind button
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { ButtonIntent, ButtonSize } from "./types.js";

const base = [
	"inline-flex items-center justify-center gap-2",
	"rounded-md font-medium border",
	"transition-colors duration-fast",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
	"disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const intentStyles: Record<ButtonIntent, string> = {
	primary: [
		"bg-surface-primary text-text-primary",
		"border-border-subtle",
		"hover:bg-surface-elevated",
		"active:bg-surface-muted",
	].join(" "),
	secondary: [
		"bg-transparent text-teal-200",
		"border-border-subtle",
		"hover:bg-surface-elevated",
		"active:bg-surface-muted",
	].join(" "),
	ghost: [
		"bg-transparent text-teal-300",
		"border-transparent",
		"hover:bg-surface-elevated",
		"active:bg-surface-muted",
	].join(" "),
	danger: [
		"bg-ember-900 text-ember-50",
		"border-ember-700",
		"hover:bg-ember-800",
		"active:bg-ember-700",
	].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-10 px-4 text-base",
	lg: "h-12 px-6 text-lg",
};

export function buttonRecipe(opts: { intent: ButtonIntent; size: ButtonSize }): string {
	return `${base} ${intentStyles[opts.intent]} ${sizeStyles[opts.size]}`;
}

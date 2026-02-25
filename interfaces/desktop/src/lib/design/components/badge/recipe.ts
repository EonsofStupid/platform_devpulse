/**
 * @file Badge Recipe
 * @kind badge
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 */

import type { BadgeIntent, BadgeSize } from "./types.js";

const base = [
	"inline-flex items-center justify-center",
	"rounded-full font-medium border",
	"whitespace-nowrap",
].join(" ");

const intentStyles: Record<BadgeIntent, string> = {
	default: [
		"bg-surface-primary text-text-primary",
		"border-border-subtle",
	].join(" "),
	info: [
		"bg-teal-900/30 text-teal-200",
		"border-teal-700/50",
	].join(" "),
	success: [
		"bg-emerald-900/30 text-emerald-200",
		"border-emerald-700/50",
	].join(" "),
	warning: [
		"bg-amber-900/30 text-amber-200",
		"border-amber-700/50",
	].join(" "),
	error: [
		"bg-ember-900/30 text-ember-200",
		"border-ember-700/50",
	].join(" "),
};

const sizeStyles: Record<BadgeSize, string> = {
	sm: "px-2 py-0.5 text-xs",
	md: "px-2.5 py-0.5 text-sm",
	lg: "px-3 py-1 text-base",
};

export function badgeRecipe(opts: { intent: BadgeIntent; size: BadgeSize }): string {
	return `${base} ${intentStyles[opts.intent]} ${sizeStyles[opts.size]}`;
}

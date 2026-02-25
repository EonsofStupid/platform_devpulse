/**
 * @file Alert Recipe
 * @kind alert
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 *
 * Alert container: border-left accent, background, icon area, padding.
 */

import type { AlertIntent } from "./types.js";

const base = [
	"relative flex items-start gap-3",
	"rounded-md border border-l-4 p-4",
	"text-sm",
].join(" ");

const intentStyles: Record<AlertIntent, string> = {
	info: [
		"bg-surface-elevated border-border-subtle border-l-teal-400",
		"text-text-primary",
	].join(" "),
	success: [
		"bg-surface-elevated border-border-subtle border-l-green-400",
		"text-text-primary",
	].join(" "),
	warning: [
		"bg-surface-elevated border-border-subtle border-l-amber-400",
		"text-text-primary",
	].join(" "),
	error: [
		"bg-surface-elevated border-border-subtle border-l-ember-400",
		"text-text-primary",
	].join(" "),
};

export function alertRecipe(opts: { intent: AlertIntent }): string {
	return `${base} ${intentStyles[opts.intent]}`;
}

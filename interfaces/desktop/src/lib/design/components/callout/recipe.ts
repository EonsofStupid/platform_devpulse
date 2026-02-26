/**
 * @file Callout Recipe
 * @kind callout
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Callout: bordered informational box with left accent, icon area, and content.
 */

import type { CalloutVariant } from "./types.js";

const base = [
	"relative flex items-start gap-3",
	"rounded-md border border-l-4 p-4",
	"text-sm",
].join(" ");

const variantStyles: Record<CalloutVariant, string> = {
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
	tip: [
		"bg-surface-elevated border-border-subtle border-l-violet-400",
		"text-text-primary",
	].join(" "),
};

export function calloutRecipe(opts: { variant: CalloutVariant }): string {
	return `${base} ${variantStyles[opts.variant]}`;
}

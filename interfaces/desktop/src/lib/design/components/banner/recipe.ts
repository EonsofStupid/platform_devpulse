/**
 * @file Banner Recipe
 * @kind banner
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Uses TW4 @theme utilities for standard values, var() for component tokens.
 *
 * Banner: full-width alert strip with icon, content, and dismiss action.
 */

import type { BannerIntent } from "./types.js";

const base = [
	"relative flex items-center gap-3",
	"w-full px-4 py-3",
	"text-sm font-medium",
].join(" ");

const intentStyles: Record<BannerIntent, string> = {
	info: [
		"bg-teal-900/30 text-teal-200",
		"border-b border-teal-700/50",
	].join(" "),
	success: [
		"bg-green-900/30 text-green-200",
		"border-b border-green-700/50",
	].join(" "),
	warning: [
		"bg-amber-900/30 text-amber-200",
		"border-b border-amber-700/50",
	].join(" "),
	error: [
		"bg-ember-900/30 text-ember-200",
		"border-b border-ember-700/50",
	].join(" "),
};

export function bannerRecipe(opts: { intent: BannerIntent }): string {
	return `${base} ${intentStyles[opts.intent]}`;
}

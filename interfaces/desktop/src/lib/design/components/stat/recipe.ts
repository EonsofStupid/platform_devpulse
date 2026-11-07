/**
 * @file Stat Recipe
 * @kind stat
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 * Stat: display statistic with label, value, and optional helptext/delta.
 */

import type { StatSize } from "./types.js";

const base = [
	"flex flex-col",
	"text-text-primary",
].join(" ");

const sizeStyles: Record<StatSize, string> = {
	sm: "gap-0.5 text-sm",
	md: "gap-1 text-base",
	lg: "gap-1.5 text-lg",
};

export function statRecipe(opts: { size: StatSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

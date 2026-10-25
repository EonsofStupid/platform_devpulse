/**
 * @file Label Recipe
 * @kind label
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { LabelSize } from "./types.js";

const base = [
	"font-medium text-text-primary",
	"cursor-pointer select-none",
	"data-[disabled]:cursor-default data-[disabled]:text-text-muted data-[disabled]:opacity-50",
].join(" ");

const sizeStyles: Record<LabelSize, string> = {
	sm: "text-xs leading-tight",
	md: "text-sm leading-normal",
	lg: "text-base leading-relaxed",
};

export function labelRecipe(opts: { size: LabelSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

/**
 * @file Form Recipe
 * @kind form
 * @layer components
 *
 * SD5-driven styling via CSS custom properties from the token pipeline.
 */

import type { FormSize } from "./types.js";

const base = [
	"flex flex-col",
	"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
].join(" ");

const sizeStyles: Record<FormSize, string> = {
	sm: "gap-3 text-sm",
	md: "gap-4 text-base",
	lg: "gap-6 text-lg",
};

export function formRecipe(opts: { size: FormSize }): string {
	return `${base} ${sizeStyles[opts.size]}`;
}

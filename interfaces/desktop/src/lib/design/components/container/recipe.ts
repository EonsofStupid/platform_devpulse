/**
 * @file Container Recipe
 * @kind container
 * @layer components
 *
 * Max-width responsive container recipe — size variants via Tailwind classes.
 */

import type { ContainerSize } from "./types.js";

const base = "mx-auto w-full px-4";

const sizeStyles: Record<ContainerSize, string> = {
	sm: "max-w-screen-sm",
	md: "max-w-screen-md",
	lg: "max-w-screen-lg",
	xl: "max-w-screen-xl",
	"2xl": "max-w-screen-2xl",
	full: "max-w-full",
};

export function containerRecipe(opts: { size?: ContainerSize }): string {
	return `${base} ${sizeStyles[opts.size ?? "xl"]}`;
}

/**
 * @file Spacer Recipe
 * @kind spacer
 * @layer components
 *
 * Flex spacer recipe — size variants via Tailwind classes.
 */

import type { SpacerSize } from "./types.js";

const sizeStyles: Record<SpacerSize, string> = {
	auto: "flex-1",
	xs: "w-1 h-1",
	sm: "w-2 h-2",
	md: "w-4 h-4",
	lg: "w-6 h-6",
	xl: "w-8 h-8",
};

export function spacerRecipe(opts: { size?: SpacerSize }): string {
	return sizeStyles[opts.size ?? "auto"];
}

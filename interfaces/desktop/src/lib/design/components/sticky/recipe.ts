/**
 * @file Sticky Recipe
 * @kind sticky
 * @layer components
 *
 * Position sticky recipe — top offset and z-index via Tailwind classes.
 */

import type { StickyTop, StickyOffset } from "./types.js";

const topStyles: Record<StickyTop, string> = {
	"0": "top-0",
	"1": "top-1",
	"2": "top-2",
	"4": "top-4",
	"8": "top-8",
	"16": "top-16",
};

const offsetStyles: Record<StickyOffset, string> = {
	none: "",
	sm: "z-10",
	md: "z-20",
	lg: "z-30",
};

export function stickyRecipe(opts: {
	top?: StickyTop;
	offset?: StickyOffset;
}): string {
	const parts: string[] = ["sticky"];
	parts.push(topStyles[opts.top ?? "0"]);
	const z = offsetStyles[opts.offset ?? "none"];
	if (z) parts.push(z);
	return parts.join(" ");
}

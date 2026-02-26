/**
 * @file Stack Recipe
 * @kind stack
 * @layer components
 *
 * Vertical flex shorthand recipe — gap and alignment via Tailwind classes.
 */

import type { StackGap, StackAlign } from "./types.js";

const gapStyles: Record<StackGap, string> = {
	"0": "gap-0",
	"1": "gap-1",
	"2": "gap-2",
	"3": "gap-3",
	"4": "gap-4",
	"6": "gap-6",
	"8": "gap-8",
	"10": "gap-10",
	"12": "gap-12",
};

const alignStyles: Record<StackAlign, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
};

export function stackRecipe(opts: {
	gap?: StackGap;
	align?: StackAlign;
}): string {
	const parts: string[] = ["flex", "flex-col"];
	if (opts.gap) parts.push(gapStyles[opts.gap]);
	if (opts.align) parts.push(alignStyles[opts.align]);
	return parts.join(" ");
}

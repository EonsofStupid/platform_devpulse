/**
 * @file HStack Recipe
 * @kind hstack
 * @layer components
 *
 * Horizontal flex shorthand recipe — gap and alignment via Tailwind classes.
 */

import type { HStackGap, HStackAlign } from "./types.js";

const gapStyles: Record<HStackGap, string> = {
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

const alignStyles: Record<HStackAlign, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};

export function hstackRecipe(opts: {
	gap?: HStackGap;
	align?: HStackAlign;
}): string {
	const parts: string[] = ["flex", "flex-row"];
	if (opts.gap) parts.push(gapStyles[opts.gap]);
	if (opts.align) parts.push(alignStyles[opts.align]);
	return parts.join(" ");
}

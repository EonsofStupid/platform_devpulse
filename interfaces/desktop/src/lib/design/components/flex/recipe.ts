/**
 * @file Flex Recipe
 * @kind flex
 * @layer components
 *
 * Flexbox layout recipe — direction, wrap, gap, align, justify via Tailwind classes.
 */

import type { FlexDirection, FlexGap, FlexAlign, FlexJustify } from "./types.js";

const directionStyles: Record<FlexDirection, string> = {
	row: "flex-row",
	"row-reverse": "flex-row-reverse",
	column: "flex-col",
	"column-reverse": "flex-col-reverse",
};

const gapStyles: Record<FlexGap, string> = {
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

const alignStyles: Record<FlexAlign, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};

const justifyStyles: Record<FlexJustify, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
};

export function flexRecipe(opts: {
	direction?: FlexDirection;
	wrap?: boolean;
	gap?: FlexGap;
	align?: FlexAlign;
	justify?: FlexJustify;
}): string {
	const parts: string[] = ["flex"];
	if (opts.direction) parts.push(directionStyles[opts.direction]);
	if (opts.wrap) parts.push("flex-wrap");
	if (opts.gap) parts.push(gapStyles[opts.gap]);
	if (opts.align) parts.push(alignStyles[opts.align]);
	if (opts.justify) parts.push(justifyStyles[opts.justify]);
	return parts.join(" ");
}

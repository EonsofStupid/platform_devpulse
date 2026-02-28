/**
 * @file Flex Recipe
 * @kind flex
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural class: flex-root
 * Direction: flex-dir-{dir}
 * Gap: flex-gap-{n}
 * Alignment: flex-align-{align}
 * Justify: flex-justify-{justify}
 * Wrap: flex-wrap-on, flex-wrap-reverse
 */

import { cn } from "$lib/design/utils/cn.js";

type FlexRecipeProps = { direction?: string; wrap?: string | boolean; gap?: string; align?: string; justify?: string };

export function flexRecipe(props: FlexRecipeProps = {}): string {
	const dirMap: Record<string, string> = {
		row: "flex-dir-row",
		column: "flex-dir-column",
		"row-reverse": "flex-dir-row-reverse",
		"column-reverse": "flex-dir-column-reverse",
	};
	const gapMap: Record<string, string> = {
		"0": "flex-gap-0",
		"1": "flex-gap-1",
		"2": "flex-gap-2",
		"3": "flex-gap-3",
		"4": "flex-gap-4",
		"6": "flex-gap-6",
		"8": "flex-gap-8",
	};
	const alignMap: Record<string, string> = {
		start: "flex-align-start",
		center: "flex-align-center",
		end: "flex-align-end",
		stretch: "flex-align-stretch",
		baseline: "flex-align-baseline",
	};
	const justifyMap: Record<string, string> = {
		start: "flex-justify-start",
		center: "flex-justify-center",
		end: "flex-justify-end",
		between: "flex-justify-between",
		around: "flex-justify-around",
		evenly: "flex-justify-evenly",
	};

	const wrapClass = props.wrap === true
		? "flex-wrap-on"
		: props.wrap === "reverse"
			? "flex-wrap-reverse"
			: undefined;

	return cn(
		"flex-root",
		dirMap[props.direction ?? "row"],
		wrapClass,
		gapMap[props.gap ?? "0"],
		alignMap[props.align ?? "stretch"],
		justifyMap[props.justify ?? "start"],
	);
}

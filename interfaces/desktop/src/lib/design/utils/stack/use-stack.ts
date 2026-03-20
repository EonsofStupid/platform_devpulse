/**
 * stack — Vertical stack (flex column) layout utility.
 *
 * Returns a Tailwind class string. All spacing via token custom properties.
 * Pattern matches recipe classes() functions — cn() composition, zero inline styles.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { StackProps } from "./stack.types.js";

const ALIGN: Record<string, string> = {
	start: "items-start",
	center: "items-center",
	end: "items-end",
	stretch: "items-stretch",
	baseline: "items-baseline",
};

const JUSTIFY: Record<string, string> = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end",
	between: "justify-between",
	around: "justify-around",
	evenly: "justify-evenly",
};

/**
 * Returns a Tailwind class string for vertical flex layout.
 *
 * @example
 * stack({ gap: "8", align: "center" })
 * // → "flex flex-col gap-8 items-center"
 */
export function stack(props: StackProps = {}): string {
	return cn(
		"flex",
		props.reverse ? "flex-col-reverse" : "flex-col",
		props.gap !== undefined && `gap-${props.gap}`,
		props.align && ALIGN[props.align],
		props.justify && JUSTIFY[props.justify],
	);
}
